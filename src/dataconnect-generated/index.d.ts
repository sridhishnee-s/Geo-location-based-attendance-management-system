import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Assignment_Key {
  userId: UUIDString;
  locationId: UUIDString;
  __typename?: 'Assignment_Key';
}

export interface AttendanceRecord_Key {
  id: UUIDString;
  __typename?: 'AttendanceRecord_Key';
}

export interface CreateAssignmentData {
  assignment_insert: Assignment_Key;
}

export interface CreateAssignmentVariables {
  userId: UUIDString;
  locationId: UUIDString;
  startDate: DateString;
}

export interface CreateUserData {
  user_insert: User_Key;
}

export interface CreateUserVariables {
  email: string;
  passwordHash: string;
  role: string;
}

export interface GetLocationData {
  location?: {
    id: UUIDString;
    name: string;
    description?: string | null;
    latitude: number;
    longitude: number;
    radius: number;
    address: string;
  } & Location_Key;
}

export interface GetLocationVariables {
  id: UUIDString;
}

export interface ListUsersData {
  users: ({
    id: UUIDString;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    role: string;
  } & User_Key)[];
}

export interface Location_Key {
  id: UUIDString;
  __typename?: 'Location_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateUserVariables): MutationRef<CreateUserData, CreateUserVariables>;
  operationName: string;
}
export const createUserRef: CreateUserRef;

export function createUser(vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;
export function createUser(dc: DataConnect, vars: CreateUserVariables): MutationPromise<CreateUserData, CreateUserVariables>;

interface GetLocationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetLocationVariables): QueryRef<GetLocationData, GetLocationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetLocationVariables): QueryRef<GetLocationData, GetLocationVariables>;
  operationName: string;
}
export const getLocationRef: GetLocationRef;

export function getLocation(vars: GetLocationVariables): QueryPromise<GetLocationData, GetLocationVariables>;
export function getLocation(dc: DataConnect, vars: GetLocationVariables): QueryPromise<GetLocationData, GetLocationVariables>;

interface CreateAssignmentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateAssignmentVariables): MutationRef<CreateAssignmentData, CreateAssignmentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateAssignmentVariables): MutationRef<CreateAssignmentData, CreateAssignmentVariables>;
  operationName: string;
}
export const createAssignmentRef: CreateAssignmentRef;

export function createAssignment(vars: CreateAssignmentVariables): MutationPromise<CreateAssignmentData, CreateAssignmentVariables>;
export function createAssignment(dc: DataConnect, vars: CreateAssignmentVariables): MutationPromise<CreateAssignmentData, CreateAssignmentVariables>;

interface ListUsersRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListUsersData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListUsersData, undefined>;
  operationName: string;
}
export const listUsersRef: ListUsersRef;

export function listUsers(): QueryPromise<ListUsersData, undefined>;
export function listUsers(dc: DataConnect): QueryPromise<ListUsersData, undefined>;

