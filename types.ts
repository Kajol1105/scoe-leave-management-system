
export enum Role {
  TEACHING_STAFF = 'Teaching Staff',
  NON_TEACHING_STAFF = 'Non-Teaching Staff',
  HOD = 'HOD',
  PRINCIPAL = 'Principal',
  ADMIN = 'Admin',
  ADMIN_1 = 'Admin 1',
  ADMIN_2 = 'Admin 2'
}

export enum ApproverRole {
  HOD = 'HOD',
  PRINCIPAL = 'Principal',
  HEAD = 'Department Head'
}

export enum Department {
  AIML = 'AIML',
  AIDA = 'AIDA',
  COMPS = 'COMPS',
  IT = 'IT',
  CIVIL = 'CIVIL',
  MECH = 'MECH',
  AUTOMOBILE = 'AUTOMOBILE',
  STUDENT_SECTION = 'Student Section',
  TPO = 'TPO',
  EXAM_CELL = 'Exam Cell',
  NOT_APPLICABLE = 'Not Applicable'
}

export enum LeaveType {
  CL = 'Casual Leave (CL)',
  CO = 'Compensatory Off (CO)',
  ML = 'Medical Leave (ML)',
  VL = 'Vacation Leave (VL)',
  EL = 'Earned Leave (EL)'
}

export enum LeaveStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface LeaveQuotas {
  CL: number;
  CO: number;
  ML: number;
  VL: number;
  EL: number;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  department: Department;
  dateOfJoining: string;
  email: string;
  password: string;
  quotas: LeaveQuotas;
  approverRole?: ApproverRole;
}

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  department: Department;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  approverId?: string;
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  leaveRequests: LeaveRequest[];
  adminAccessCode: string; // New field for security
}
