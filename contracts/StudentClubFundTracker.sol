// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract StudentClubFundTracker {
    enum RequestStatus {
        Submitted,
        Approved,
        Rejected,
        Disbursed
    }

    struct Club {
        string name;
        address lead;
        uint256 budgetPaise;
        uint256 reservedPaise;
        uint256 spentPaise;
        bool active;
    }

    struct StudentProfile {
        uint256 clubId;
        bool isActive;
    }

    struct ExpenseRequest {
        uint256 id;
        uint256 clubId;
        address student;
        uint256 amountPaise;
        string purpose;
        string receiptId;
        string receiptHash;
        RequestStatus status;
        string leadNote;
        string payoutReference;
    }

    uint256 public nextClubId = 1;
    uint256 public nextRequestId = 1;

    mapping(address => bool) public isAdmin;
    mapping(uint256 => Club) private clubs;
    mapping(address => StudentProfile) private studentProfiles;
    mapping(uint256 => ExpenseRequest) private requests;
    mapping(address => uint256[]) private studentRequestIds;
    uint256[] private clubIds;

    event AdminUpdated(address indexed account, bool approved);
    event ClubCreated(
        uint256 indexed clubId,
        string name,
        address indexed lead,
        uint256 budgetPaise
    );
    event ClubBudgetUpdated(uint256 indexed clubId, uint256 budgetPaise);
    event ClubLeadUpdated(uint256 indexed clubId, address indexed lead);
    event StudentAdded(uint256 indexed clubId, address indexed student);
    event StudentRemoved(uint256 indexed clubId, address indexed student);
    event ExpenseRequestSubmitted(
        uint256 indexed requestId,
        uint256 indexed clubId,
        address indexed student,
        uint256 amountPaise,
        string receiptId,
        string receiptHash
    );
    event ExpenseRequestReviewed(
        uint256 indexed requestId,
        bool approved,
        string note
    );
    event ExpenseRequestDisbursed(
        uint256 indexed requestId,
        uint256 indexed clubId,
        address indexed student,
        string payoutReference
    );

    error AdminOnly();
    error ClubLeadOnly();
    error InvalidAddress();
    error InvalidClub();
    error InvalidBudget();
    error StudentNotRegistered();
    error StudentInDifferentClub();
    error RequestNotFound();
    error InvalidRequestState();
    error BudgetExceeded();

    modifier onlyAdmin() {
        if (!isAdmin[msg.sender]) revert AdminOnly();
        _;
    }

    constructor(address initialAdmin) {
        if (initialAdmin == address(0)) revert InvalidAddress();
        isAdmin[initialAdmin] = true;
        emit AdminUpdated(initialAdmin, true);
    }

    function setAdmin(address account, bool approved) external onlyAdmin {
        if (account == address(0)) revert InvalidAddress();
        isAdmin[account] = approved;
        emit AdminUpdated(account, approved);
    }

    function createClub(
        string calldata name,
        address lead,
        uint256 budgetPaise
    ) external onlyAdmin {
        if (lead == address(0)) revert InvalidAddress();
        if (bytes(name).length == 0) revert InvalidClub();
        if (budgetPaise == 0) revert InvalidBudget();

        uint256 clubId = nextClubId++;

        clubs[clubId] = Club({
            name: name,
            lead: lead,
            budgetPaise: budgetPaise,
            reservedPaise: 0,
            spentPaise: 0,
            active: true
        });

        clubIds.push(clubId);

        emit ClubCreated(clubId, name, lead, budgetPaise);
    }

    function setClubBudget(
        uint256 clubId,
        uint256 budgetPaise
    ) external onlyAdmin {
        Club storage club = clubs[clubId];
        if (!club.active) revert InvalidClub();
        if (budgetPaise < club.reservedPaise + club.spentPaise) {
            revert InvalidBudget();
        }

        club.budgetPaise = budgetPaise;
        emit ClubBudgetUpdated(clubId, budgetPaise);
    }

    function setClubLead(uint256 clubId, address lead) external onlyAdmin {
        Club storage club = clubs[clubId];
        if (!club.active) revert InvalidClub();
        if (lead == address(0)) revert InvalidAddress();

        club.lead = lead;
        emit ClubLeadUpdated(clubId, lead);
    }

    function addStudentToClub(
        uint256 clubId,
        address student
    ) external onlyAdmin {
        Club storage club = clubs[clubId];
        if (!club.active) revert InvalidClub();
        if (student == address(0)) revert InvalidAddress();

        StudentProfile storage profile = studentProfiles[student];
        if (profile.isActive && profile.clubId != clubId) {
            revert StudentInDifferentClub();
        }

        profile.clubId = clubId;
        profile.isActive = true;

        emit StudentAdded(clubId, student);
    }

    function removeStudentFromClub(address student) external onlyAdmin {
        StudentProfile storage profile = studentProfiles[student];
        if (!profile.isActive) revert StudentNotRegistered();

        uint256 clubId = profile.clubId;
        profile.isActive = false;
        profile.clubId = 0;

        emit StudentRemoved(clubId, student);
    }

    function submitExpenseRequest(
        uint256 clubId,
        uint256 amountPaise,
        string calldata purpose,
        string calldata receiptId,
        string calldata receiptHash
    ) external {
        StudentProfile memory profile = studentProfiles[msg.sender];
        if (!profile.isActive) revert StudentNotRegistered();
        if (profile.clubId != clubId) revert StudentInDifferentClub();
        if (!clubs[clubId].active) revert InvalidClub();
        if (amountPaise == 0) revert InvalidBudget();
        if (bytes(purpose).length == 0) revert InvalidRequestState();
        if (bytes(receiptId).length == 0 || bytes(receiptHash).length == 0) {
            revert InvalidRequestState();
        }

        uint256 requestId = nextRequestId++;

        requests[requestId] = ExpenseRequest({
            id: requestId,
            clubId: clubId,
            student: msg.sender,
            amountPaise: amountPaise,
            purpose: purpose,
            receiptId: receiptId,
            receiptHash: receiptHash,
            status: RequestStatus.Submitted,
            leadNote: "",
            payoutReference: ""
        });

        studentRequestIds[msg.sender].push(requestId);

        emit ExpenseRequestSubmitted(
            requestId,
            clubId,
            msg.sender,
            amountPaise,
            receiptId,
            receiptHash
        );
    }

    function reviewRequest(
        uint256 requestId,
        bool approve,
        string calldata note
    ) external {
        ExpenseRequest storage expenseRequest = requests[requestId];
        if (expenseRequest.id == 0) revert RequestNotFound();
        if (expenseRequest.status != RequestStatus.Submitted) {
            revert InvalidRequestState();
        }

        Club storage club = clubs[expenseRequest.clubId];
        if (club.lead != msg.sender) revert ClubLeadOnly();

        expenseRequest.leadNote = note;

        if (approve) {
            uint256 requiredAmount = club.reservedPaise +
                club.spentPaise +
                expenseRequest.amountPaise;
            if (requiredAmount > club.budgetPaise) revert BudgetExceeded();

            club.reservedPaise += expenseRequest.amountPaise;
            expenseRequest.status = RequestStatus.Approved;
        } else {
            expenseRequest.status = RequestStatus.Rejected;
        }

        emit ExpenseRequestReviewed(requestId, approve, note);
    }

    function disburseRequest(
        uint256 requestId,
        string calldata payoutReference
    ) external onlyAdmin {
        ExpenseRequest storage expenseRequest = requests[requestId];
        if (expenseRequest.id == 0) revert RequestNotFound();
        if (expenseRequest.status != RequestStatus.Approved) {
            revert InvalidRequestState();
        }

        Club storage club = clubs[expenseRequest.clubId];
        club.reservedPaise -= expenseRequest.amountPaise;
        club.spentPaise += expenseRequest.amountPaise;

        expenseRequest.status = RequestStatus.Disbursed;
        expenseRequest.payoutReference = payoutReference;

        emit ExpenseRequestDisbursed(
            requestId,
            expenseRequest.clubId,
            expenseRequest.student,
            payoutReference
        );
    }

    function getClubIds() external view returns (uint256[] memory) {
        return clubIds;
    }

    function getClub(
        uint256 clubId
    )
        external
        view
        returns (
            string memory name,
            address lead,
            uint256 budgetPaise,
            uint256 reservedPaise,
            uint256 spentPaise,
            bool active
        )
    {
        Club memory club = clubs[clubId];
        if (!club.active) revert InvalidClub();

        return (
            club.name,
            club.lead,
            club.budgetPaise,
            club.reservedPaise,
            club.spentPaise,
            club.active
        );
    }

    function getStudentProfile(
        address student
    ) external view returns (uint256 clubId, bool isActive) {
        StudentProfile memory profile = studentProfiles[student];
        return (profile.clubId, profile.isActive);
    }

    function getStudentRequestIds(
        address student
    ) external view returns (uint256[] memory) {
        return studentRequestIds[student];
    }

    function getRequest(
        uint256 requestId
    )
        external
        view
        returns (
            uint256 clubId,
            address student,
            uint256 amountPaise,
            string memory purpose,
            string memory receiptId,
            string memory receiptHash,
            uint8 status,
            string memory leadNote,
            string memory payoutReference
        )
    {
        ExpenseRequest memory expenseRequest = requests[requestId];
        if (expenseRequest.id == 0) revert RequestNotFound();

        return (
            expenseRequest.clubId,
            expenseRequest.student,
            expenseRequest.amountPaise,
            expenseRequest.purpose,
            expenseRequest.receiptId,
            expenseRequest.receiptHash,
            uint8(expenseRequest.status),
            expenseRequest.leadNote,
            expenseRequest.payoutReference
        );
    }
}
