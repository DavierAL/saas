/**
 * Manage Appointments — Use case for barbería appointments.
 */
import type { IAppointmentRepositoryPort, Appointment, AppointmentStatus } from '../ports/appointment-repository.port';

export const listAppointments = async (
  tenantId: string,
  appointmentRepo: IAppointmentRepositoryPort
): Promise<Appointment[]> => {
  return appointmentRepo.findAll(tenantId);
};

export const getAppointmentById = async (
  id: string,
  tenantId: string,
  appointmentRepo: IAppointmentRepositoryPort
): Promise<Appointment | null> => {
  return appointmentRepo.findById(id, tenantId);
};

export const getAppointmentsByDateRange = async (
  tenantId: string,
  start: Date,
  end: Date,
  appointmentRepo: IAppointmentRepositoryPort
): Promise<Appointment[]> => {
  return appointmentRepo.findByDateRange(tenantId, start, end);
};

export const createAppointment = async (
  customerName: string,
  itemId: string,
  startTime: string,
  serviceDurationMinutes: number,
  tenantId: string,
  appointmentRepo: IAppointmentRepositoryPort
): Promise<Appointment> => {
  // Calculate end time
  const start = new Date(startTime);
  const end = new Date(start.getTime() + serviceDurationMinutes * 60000);
  const endTime = end.toISOString();
  
  // Check for overlap
  const hasOverlap = await appointmentRepo.checkOverlap(
    tenantId, startTime, endTime
  );
  
  if (hasOverlap) {
    throw new Error('Ya existe una cita en ese horario');
  }
  
  return appointmentRepo.insert({
    tenant_id: tenantId,
    customer_name: customerName,
    item_id: itemId,
    start_time: startTime,
    status: 'scheduled',
  });
};

export const updateAppointmentStatus = async (
  id: string,
  status: AppointmentStatus,
  tenantId: string,
  appointmentRepo: IAppointmentRepositoryPort
): Promise<void> => {
  return appointmentRepo.updateStatus(id, status, tenantId);
};

export const cancelAppointment = async (
  id: string,
  tenantId: string,
  appointmentRepo: IAppointmentRepositoryPort
): Promise<void> => {
  return appointmentRepo.updateStatus(id, 'cancelled', tenantId);
};

export const completeAppointment = async (
  id: string,
  tenantId: string,
  appointmentRepo: IAppointmentRepositoryPort
): Promise<void> => {
  return appointmentRepo.updateStatus(id, 'completed', tenantId);
};