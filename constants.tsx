
import { Role, Department, LeaveQuotas } from './types';

export const DEFAULT_QUOTAS: LeaveQuotas = {
  CL: 12,
  CO: 5,
  ML: 10,
  VL: 15,
  EL: 15
};

export const DEPARTMENTS = Object.values(Department);
export const ROLES = Object.values(Role);

export const INITIAL_USERS = [
  {
    id: 'admin-1',
    name: 'College Admin',
    role: Role.ADMIN_1,
    department: Department.COMPS,
    dateOfJoining: '2020-01-01',
    email: 'admin@scoe.edu',
    password: 'admin',
    quotas: { ...DEFAULT_QUOTAS }
  },
  {
    id: 'principal-1',
    name: 'Dr. Manjusha Deshmukh',
    role: Role.PRINCIPAL,
    department: Department.COMPS,
    dateOfJoining: '2015-06-15',
    email: 'principal@scoe.edu',
    password: 'principal',
    quotas: { ...DEFAULT_QUOTAS }
  }
];
