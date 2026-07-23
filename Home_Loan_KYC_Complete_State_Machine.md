# Home Loan Mobile App - KYC Completion State Machine (Comprehensive)

**Purpose:** Provide a complete hierarchical state machine and domain tree for KYC completion in a home loan application.

## 0\. Goal

Verified customer eligible to proceed to underwriting.  
Terminal outcomes: VERIFIED, REJECTED, EXPIRED, WITHDRAWN.

## 1\. Actors

• Customer  
• Loan Officer  
• Operations Reviewer  
• OCR Service  
• PAN Verification API  
• Aadhaar/Identity API  
• CKYC Registry  
• AML/Sanctions Engine  
• Fraud Engine  
• Face Match & Liveness AI  
• Notification Service  
• Scheduler/Timeout Service  
• Audit & Analytics

## 2\. Domains

Customer  
├── Identity  
├── Documents  
├── Consent  
├── Face & Video  
├── Risk  
├── Verification  
├── Communication  
└── Audit

## 3\. Entity Tree

Home Loan Application  
├── Customer  
│ ├── Profile  
│ ├── Contact  
│ └── Address  
├── KYC Case  
│ ├── Identity  
│ │ ├── PAN  
│ │ ├── Aadhaar  
│ │ ├── Name  
│ │ └── DOB  
│ ├── Documents  
│ │ ├── PAN Card  
│ │ ├── Aadhaar  
│ │ ├── Address Proof  
│ │ ├── Income Proof  
│ │ └── Selfie  
│ ├── Consent  
│ ├── Face Verification  
│ ├── Video KYC  
│ ├── Risk Assessment  
│ ├── Manual Review  
│ ├── Notifications  
│ └── Audit Trail

## 4\. Relationships

Customer owns Loan Application.  
Loan Application owns KYC Case.  
KYC Case aggregates Identity, Documents, Consent, Face, Video, Risk.  
Risk can block Approval.  
Approval unlocks Underwriting.

## 5\. Parallel Lifecycles

Documents: Not Uploaded → Uploaded → OCR → Validation → Accepted / Reupload  
PAN: Not Submitted → Submitted → Verifying → Verified / Failed  
Aadhaar: Not Submitted → OTP Sent → OTP Verified → Verified / Failed  
Consent: Pending → Accepted → Recorded → Expired  
Face: Waiting → Selfie → Liveness → Face Match → Passed / Failed  
Video: Not Scheduled → Scheduled → Connected → Recording → Review → Approved / Rejected  
Risk: Not Started → Running → Low / Medium / High → Manual Review → Cleared / Rejected

## 6\. Master Orchestration

Draft  
└── Collect Documents  
└── Verify Identity  
├── PAN  
├── Aadhaar  
└── CKYC  
└── Validate Documents  
└── Face Verification  
└── Video KYC  
└── Risk Assessment  
├── Auto Approve  
│ └── VERIFIED  
├── Manual Review  
│ ├── Approved → VERIFIED  
│ ├── Reupload → Collect Documents  
│ └── Rejected → REJECTED  
├── Timeout → EXPIRED  
└── Customer Cancel → WITHDRAWN

## 7\. Events

Customer: Upload, Delete, Retake, Retry OTP, Submit, Resume, Cancel.  
System: OCR Complete, API Success/Failure, Timeout, Session Expired, Risk Calculated.  
Reviewer: Approve, Reject, Request Reupload, Escalate.

## 8\. Guards

Submission requires mandatory documents, valid consent and active session.  
Approval requires PAN, Aadhaar, document validation, face match, video approval, AML clear, sanctions clear and acceptable fraud score.

## 9\. Edge Cases

• Blurry document  
• OCR low confidence  
• Duplicate PAN  
• Aadhaar OTP expired  
• API outage  
• Face mismatch  
• Deepfake detected  
• Video interrupted  
• Session timeout  
• Existing CKYC found  
• Sanctions hit  
• Customer resumes later  
• Customer withdraws

## 10\. Error Classes

Validation, Business Rule, Third-party Dependency, Network, Security, Fraud, Unknown.

## 11\. Recovery

Retry, Resume, Reupload, Manual Review, Background Retry, Rollback, Escalation, Cancel.

## 12\. Side Effects

Audit log, notifications, analytics, CRM update, webhook, eligibility refresh.

## 13\. Observability

Capture Case ID, Customer ID, Application ID, Actor, Event, From State, To State, Timestamp, Device, IP, Correlation ID, API latency, Reason Code.