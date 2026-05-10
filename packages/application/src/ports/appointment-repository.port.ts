/**
 * Appointment Repository Port — Contract for appointment operations.
 */

export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  readonly id: string;
  readonly tenant_id: string;
  readonly customer_name: string;
  readonly item_id: string; // service
  readonly start_time: string;
  readonly end_time: string | null;
  readonly status: AppointmentStatus;
}

export interface IAppointmentRepositoryPort {
  findAll(tenantId: string): Promise<Appointment[]>;
  findById(id: string, tenantId: string): Promise<Appointment | null>;
  findByDateRange(tenantId: string, start: Date, end: Date): Promise<Appointment[]>;
  findByCustomer(tenantId: string, customerName: string): Promise<Appointment[]>;
  insert(appointment: Omit<Appointment, 'id' | 'end_time'>): Promise<Appointment>;
  updateStatus(id: string, status: AppointmentStatus, tenantId: string): Promise<void>;
  softDelete(id: string, tenantId: string): Promise<void>;
  
  // Validation
  checkOverlap(tenantId: string, startTime: string, endTime: string, excludeId?: string): Promise<boolean>;
}