import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  boolean,
  timestamp,
  integer,
  text,
  decimal,
  uniqueIndex,
  foreignKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const genderEnum = pgEnum('Gender', ['MALE', 'FEMALE']);
export const roleEnum = pgEnum('Role', [
  'SUPERADMIN',
  'Manager',
  'DOCTOR',
  'USER',
]);
export const daysOfWeekEnum = pgEnum('DaysOfWeek', [
  'SATURDAY',
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
]);
export const appointmentStatusEnum = pgEnum('AppointmentStatus', [
  'PENDING',
  'COMPLETED',
  'CANCELLED',
]);
export const invoiceStatusEnum = pgEnum('InvoiceStatus', [
  'Pending',
  'Paid',
  'Canceled',
]);

// Tables
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    email: varchar('email', { length: 100 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    isActive: boolean('isActive').notNull().default(true),
    verified: boolean('verified').notNull().default(false),
    resetPasswordToken: varchar('resetPasswordToken', { length: 255 }),
    role: roleEnum('role').notNull().default('Manager'),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
    deletedAt: timestamp('deletedAt', { precision: 3 }),
    cancellationLogId: integer('cancellationLogId'),
  },
  (table) => ({
    emailIdx: uniqueIndex('users_email_key').on(table.email),
    cancellationLogFk: foreignKey({
      columns: [table.cancellationLogId],
      foreignColumns: [cancellationLogs.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export const clinics = pgTable(
  'clinics',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull(),
    address: varchar('address', { length: 255 }),
    manager: varchar('manager', { length: 100 }),
    email: varchar('email', { length: 100 }).unique(),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
    deletedAt: timestamp('deletedAt', { precision: 3 }),
  },
  (table) => ({
    emailIdx: uniqueIndex('clinics_email_key').on(table.email),
  }),
);

export const usersClinics = pgTable(
  'users_clinics',
  {
    id: serial('id').primaryKey(),
    userId: integer('userId').notNull().unique(),
    clinicId: integer('clinicId').notNull(),
  },
  (table) => ({
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    clinicFk: foreignKey({
      columns: [table.clinicId],
      foreignColumns: [clinics.id],
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
  }),
);

export const usersProfiles = pgTable(
  'users_profiles',
  {
    id: serial('id').primaryKey(),
    firstName: varchar('firstName', { length: 50 }),
    lastName: varchar('lastName', { length: 50 }),
    phone: varchar('phone', { length: 50 }),
    birthday: timestamp('birthday', { precision: 3 }).notNull(),
    socialId: varchar('socialId', { length: 100 }).notNull(),
    license: varchar('license', { length: 255 }).unique(),
    specialization: varchar('specialization', { length: 150 }),
    bio: text('bio').notNull(),
    gender: genderEnum('gender').notNull(),
    userId: integer('userId').notNull().unique(),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
  },
  (table) => ({
    licenseIdx: uniqueIndex('users_profiles_license_key').on(table.license),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const patients = pgTable(
  'patients',
  {
    id: serial('id').primaryKey(),
    firstName: varchar('firstName', { length: 50 }),
    lastName: varchar('lastName', { length: 50 }),
    phone: varchar('phone', { length: 50 }),
    gender: genderEnum('gender').notNull(),
    clinicId: integer('clinicId').notNull().unique(),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
  },
  (table) => ({
    clinicFk: foreignKey({
      columns: [table.clinicId],
      foreignColumns: [clinics.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const patientsProfiles = pgTable(
  'patients_profiles',
  {
    id: serial('id').primaryKey(),
    birthday: timestamp('birthday', { precision: 3 }).notNull(),
    occupation: varchar('Occupation', { length: 50 }),
    length: integer('length'),
    weight: decimal('weight', { precision: 10, scale: 2 }),
    history: text('history'),
    patientId: integer('patientId').notNull().unique(),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
  },
  (table) => ({
    patientFk: foreignKey({
      columns: [table.patientId],
      foreignColumns: [patients.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const appointments = pgTable(
  'appointments',
  {
    id: serial('id').primaryKey(),
    status: appointmentStatusEnum('status').notNull().default('PENDING'),
    appointmentDate: timestamp('appointmentDate', { precision: 3 }).notNull(),
    reason: text('reason'),
    note: text('note'),
    createdByUserId: integer('createdByUserId').notNull().unique(),
    assignedToId: integer('assignedToId').notNull().unique(),
    clinicId: integer('clinicId').notNull().unique(),
    patientId: integer('patientId').notNull().unique(),
    treatmentPlanId: integer('treatmentPlanId').unique(),
    billId: integer('billId').notNull().unique(),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
    profileId: integer('profileId'),
  },
  (table) => ({
    createdByFk: foreignKey({
      columns: [table.createdByUserId],
      foreignColumns: [users.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    assignedToFk: foreignKey({
      columns: [table.assignedToId],
      foreignColumns: [users.id],
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    clinicFk: foreignKey({
      columns: [table.clinicId],
      foreignColumns: [clinics.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    patientFk: foreignKey({
      columns: [table.patientId],
      foreignColumns: [patients.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    treatmentPlanFk: foreignKey({
      columns: [table.treatmentPlanId],
      foreignColumns: [treatmentPlans.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
    billFk: foreignKey({
      columns: [table.billId],
      foreignColumns: [bills.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    profileFk: foreignKey({
      columns: [table.profileId],
      foreignColumns: [usersProfiles.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export const schedules = pgTable(
  'schedules',
  {
    id: serial('id').primaryKey(),
    dayOfWeek: daysOfWeekEnum('dayOfWeek').notNull(),
    availableFrom: timestamp('availableFrom', { precision: 3 }).notNull(),
    availableTo: timestamp('availableTo', { precision: 3 }).notNull(),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
    profileId: integer('profileId'),
  },
  (table) => ({
    profileFk: foreignKey({
      columns: [table.profileId],
      foreignColumns: [usersProfiles.id],
    })
      .onDelete('set null')
      .onUpdate('cascade'),
  }),
);

export const bills = pgTable('bills', {
  id: serial('id').primaryKey(),
  amount: decimal('amount', { precision: 65, scale: 30 }).notNull(),
  status: invoiceStatusEnum('status').notNull().default('Pending'),
  createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
});

export const treatmentPlans = pgTable(
  'treatmentPlans',
  {
    id: serial('id').primaryKey(),
    description: text('description').notNull(),
    patientProfileId: integer('PatientProfileId').notNull().unique(),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
  },
  (table) => ({
    patientProfileFk: foreignKey({
      columns: [table.patientProfileId],
      foreignColumns: [patientsProfiles.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const progressionNotes = pgTable(
  'progressionNotes',
  {
    id: serial('id').primaryKey(),
    description: text('description').notNull(),
    patientProfileId: integer('PatientProfileId').notNull().unique(),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
  },
  (table) => ({
    patientProfileFk: foreignKey({
      columns: [table.patientProfileId],
      foreignColumns: [patientsProfiles.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const examinations = pgTable(
  'examinations',
  {
    id: serial('id').primaryKey(),
    subjectivePainScale: integer('subjectivePainScale'),
    subjectiveLocation: varchar('subjectiveLocation', { length: 255 }),
    subjectiveDescription: text('subjectiveDescription'),
    subjectiveAggravatingFactors: text('subjectiveAggravatingFactors'),
    objectivePosture: varchar('objectivePosture', { length: 255 }),
    objectiveRegion: varchar('objectiveRegion', { length: 255 }),
    objectivePhysiologicalMotion: text('objectivePhysiologicalMotion'),
    palpation: text('palpation'),
    patientProfileId: integer('PatientProfileId').notNull().unique(),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
  },
  (table) => ({
    patientProfileFk: foreignKey({
      columns: [table.patientProfileId],
      foreignColumns: [patientsProfiles.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const cancellationLogs = pgTable(
  'cancellationLogs',
  {
    id: serial('id').primaryKey(),
    action: varchar('action', { length: 255 }).notNull(),
    description: varchar('description', { length: 255 }),
    appointmentId: integer('appointmentId').notNull().unique(),
    userId: integer('userId').notNull().unique(),
    clinicId: integer('clinicId').notNull().unique(),
    createdAt: timestamp('createdAt', { precision: 3 }).notNull().defaultNow(),
    updatedAt: timestamp('updatedAt', { precision: 3 }).notNull(),
    deletedAt: timestamp('deletedAt', { precision: 3 }),
  },
  (table) => ({
    appointmentFk: foreignKey({
      columns: [table.appointmentId],
      foreignColumns: [appointments.id],
    })
      .onDelete('restrict')
      .onUpdate('cascade'),
    userFk: foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    clinicFk: foreignKey({
      columns: [table.clinicId],
      foreignColumns: [clinics.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
  }),
);

export const clinicToUser = pgTable(
  '_ClinicToUser',
  {
    a: integer('A').notNull(),
    b: integer('B').notNull(),
  },
  (table) => ({
    pk: uniqueIndex('_ClinicToUser_AB_pkey').on(table.a, table.b),
    clinicFk: foreignKey({
      columns: [table.a],
      foreignColumns: [clinics.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    userFk: foreignKey({
      columns: [table.b],
      foreignColumns: [users.id],
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    bIdx: uniqueIndex('_ClinicToUser_B_index').on(table.b),
  }),
);

// Relations (optional, but recommended for type safety)
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(usersProfiles, {
    fields: [users.id],
    references: [usersProfiles.userId],
  }),
  clinics: many(usersClinics),
  cancellationLog: one(cancellationLogs, {
    fields: [users.cancellationLogId],
    references: [cancellationLogs.id],
  }),
}));

export const clinicsRelations = relations(clinics, ({ many }) => ({
  users: many(usersClinics),
  patients: many(patients),
}));

export const usersClinicsRelations = relations(usersClinics, ({ one }) => ({
  user: one(users, {
    fields: [usersClinics.userId],
    references: [users.id],
  }),
  clinic: one(clinics, {
    fields: [usersClinics.clinicId],
    references: [clinics.id],
  }),
}));

export const usersProfilesRelations = relations(
  usersProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [usersProfiles.userId],
      references: [users.id],
    }),
    schedules: many(schedules),
  }),
);

export const patientsRelations = relations(patients, ({ one, many }) => ({
  clinic: one(clinics, {
    fields: [patients.clinicId],
    references: [clinics.id],
  }),
  profile: one(patientsProfiles, {
    fields: [patients.id],
    references: [patientsProfiles.patientId],
  }),
}));

export const patientsProfilesRelations = relations(
  patientsProfiles,
  ({ one, many }) => ({
    patient: one(patients, {
      fields: [patientsProfiles.patientId],
      references: [patients.id],
    }),
    treatmentPlans: many(treatmentPlans),
    progressionNotes: many(progressionNotes),
    examinations: many(examinations),
  }),
);

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  createdBy: one(users, {
    fields: [appointments.createdByUserId],
    references: [users.id],
  }),
  assignedTo: one(users, {
    fields: [appointments.assignedToId],
    references: [users.id],
  }),
  clinic: one(clinics, {
    fields: [appointments.clinicId],
    references: [clinics.id],
  }),
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  treatmentPlan: one(treatmentPlans, {
    fields: [appointments.treatmentPlanId],
    references: [treatmentPlans.id],
  }),
  bill: one(bills, {
    fields: [appointments.billId],
    references: [bills.id],
  }),
  profile: one(usersProfiles, {
    fields: [appointments.profileId],
    references: [usersProfiles.id],
  }),
}));

export const schedulesRelations = relations(schedules, ({ one }) => ({
  profile: one(usersProfiles, {
    fields: [schedules.profileId],
    references: [usersProfiles.id],
  }),
}));

export const treatmentPlansRelations = relations(treatmentPlans, ({ one }) => ({
  patientProfile: one(patientsProfiles, {
    fields: [treatmentPlans.patientProfileId],
    references: [patientsProfiles.id],
  }),
}));

export const progressionNotesRelations = relations(
  progressionNotes,
  ({ one }) => ({
    patientProfile: one(patientsProfiles, {
      fields: [progressionNotes.patientProfileId],
      references: [patientsProfiles.id],
    }),
  }),
);

export const examinationsRelations = relations(examinations, ({ one }) => ({
  patientProfile: one(patientsProfiles, {
    fields: [examinations.patientProfileId],
    references: [patientsProfiles.id],
  }),
}));

export const cancellationLogsRelations = relations(
  cancellationLogs,
  ({ one }) => ({
    appointment: one(appointments, {
      fields: [cancellationLogs.appointmentId],
      references: [appointments.id],
    }),
    user: one(users, {
      fields: [cancellationLogs.userId],
      references: [users.id],
    }),
    clinic: one(clinics, {
      fields: [cancellationLogs.clinicId],
      references: [clinics.id],
    }),
  }),
);

export const clinicToUserRelations = relations(clinicToUser, ({ one }) => ({
  clinic: one(clinics, {
    fields: [clinicToUser.a],
    references: [clinics.id],
  }),
  user: one(users, {
    fields: [clinicToUser.b],
    references: [users.id],
  }),
}));
