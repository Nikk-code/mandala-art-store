import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole } from '@prisma/client';
import { adminService } from '../src/services/admin.service';
import { userRepository } from '../src/repositories/user.repository';
import { ValidationError, NotFoundError, BadRequestError } from '../src/errors';

describe('Admin Provisioning (promoteUserToAdmin)', () => {
  const userId = '11111111-2222-4333-8444-555555555555';

  const sampleCustomer = {
    id: userId,
    email: 'operator@mandala.test',
    passwordHash: 'secret_hash',
    firstName: 'Operator',
    lastName: 'One',
    phone: null,
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects missing or empty email with ValidationError', async () => {
    await expect(adminService.promoteUserToAdmin('')).rejects.toThrow(ValidationError);
    await expect(adminService.promoteUserToAdmin('   ')).rejects.toThrow(ValidationError);
  });

  it('rejects invalid email formats with ValidationError', async () => {
    await expect(adminService.promoteUserToAdmin('invalid-email')).rejects.toThrow(ValidationError);
    await expect(adminService.promoteUserToAdmin('@no-domain.com')).rejects.toThrow(
      ValidationError
    );
  });

  it('throws NotFoundError if no account exists with the specified email', async () => {
    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

    await expect(adminService.promoteUserToAdmin('unknown@mandala.test')).rejects.toThrow(
      NotFoundError
    );
  });

  it('throws BadRequestError if the targeted account is deactivated', async () => {
    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue({
      ...sampleCustomer,
      isActive: false,
    });

    await expect(adminService.promoteUserToAdmin('operator@mandala.test')).rejects.toThrow(
      BadRequestError
    );
  });

  it('successfully promotes an active CUSTOMER account to ADMIN', async () => {
    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(sampleCustomer);
    const updateSpy = vi.spyOn(userRepository, 'update').mockResolvedValue({
      ...sampleCustomer,
      role: UserRole.ADMIN,
    });

    const result = await adminService.promoteUserToAdmin('  OPERATOR@mandala.test  ');

    expect(updateSpy).toHaveBeenCalledWith(userId, {
      role: UserRole.ADMIN,
    });
    expect(result).toEqual({
      userId,
      email: 'operator@mandala.test',
      role: 'ADMIN',
      alreadyAdmin: false,
    });
  });

  it('safely handles repeated execution if user is already an ADMIN (idempotent)', async () => {
    const existingAdmin = {
      ...sampleCustomer,
      role: UserRole.ADMIN,
    };
    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(existingAdmin);
    const updateSpy = vi.spyOn(userRepository, 'update');

    const result = await adminService.promoteUserToAdmin('operator@mandala.test');

    expect(updateSpy).not.toHaveBeenCalled();
    expect(result).toEqual({
      userId,
      email: 'operator@mandala.test',
      role: 'ADMIN',
      alreadyAdmin: true,
    });
  });
});
