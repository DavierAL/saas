export interface RemoteValidationResult {
  readonly valid_until: string;
  readonly server_time: string;
}

export interface IRemoteValidatorPort {
  validateSubscription(tenantId: string): Promise<RemoteValidationResult>;
}
