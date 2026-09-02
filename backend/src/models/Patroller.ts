import {Model, DataTypes, Association, FindOptions} from 'sequelize';
import sequelize from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './Organization';
import {PaginationOptions} from "../shared/domain/PaginationOptions";
import {PaginatedResults} from "../shared/domain/PaginatedResults";
import crypto from "crypto";
import {hashPassword, comparePassword} from "../services/authService";

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_MS = 5 * 60 * 1000; // 5 minutes — a throttle, not a permanent lockout

interface PatrollerAttributes {
	id: string;
	name: string;
	identifier: string;
	email?: string;
	phone?: string;
	pin?: string;
	failedPinAttempts: number;
	pinLockedUntil?: Date;
	siaLicenceNumber?: string;
	siaLicenceType?: string;
	siaLicenceExpiry?: Date;
	rightToWorkDocumentType?: string;
	rightToWorkVerifiedAt?: Date;
	rightToWorkExpiry?: Date;
	workingTimeOptOut: boolean;
	nationalInsuranceNumber?: string;
	organizationId: string;
}

export class Patroller extends Model<PatrollerAttributes> implements PatrollerAttributes {
	public id!: string;
	public name!: string;
	public identifier!: string;
	public email?: string;
	public phone?: string;
	public pin?: string;
	public failedPinAttempts!: number;
	public pinLockedUntil?: Date;
	public siaLicenceNumber?: string;
	public siaLicenceType?: string;
	public siaLicenceExpiry?: Date;
	public rightToWorkDocumentType?: string;
	public rightToWorkVerifiedAt?: Date;
	public rightToWorkExpiry?: Date;
	public workingTimeOptOut!: boolean;
	public nationalInsuranceNumber?: string;
	public organizationId!: string;

	public static associations: {
		organization: Association<Patroller, Organization>;
	};

	async comparePin(pin: string): Promise<boolean> {
		if (!this.pin) {
			return false;
		}
		return await comparePassword(pin, this.pin);
	}

	isPinLocked(): boolean {
		return !!this.pinLockedUntil && this.pinLockedUntil.getTime() > Date.now();
	}

	async registerFailedPinAttempt(): Promise<void> {
		const attempts = this.failedPinAttempts + 1;
		const update: Partial<PatrollerAttributes> = { failedPinAttempts: attempts };
		if (attempts >= MAX_PIN_ATTEMPTS) {
			update.pinLockedUntil = new Date(Date.now() + PIN_LOCKOUT_MS);
			update.failedPinAttempts = 0;
		}
		await this.update(update);
	}

	async resetPinAttempts(): Promise<void> {
		if (this.failedPinAttempts > 0 || this.pinLockedUntil) {
			await this.update({ failedPinAttempts: 0, pinLockedUntil: undefined });
		}
	}

	public static async findByOrganizationId(
		organizationId: string,
		{ page = 1, limit = 10 }: PaginationOptions = { page : 1, limit : 10 }
	): Promise<PaginatedResults<Patroller>> {
		const offset = (page - 1) * limit;

		const options: FindOptions = {
			where: { organizationId },
			limit,
			offset,
			include: [{ model: Organization }]
		};

		const { count, rows } = await this.findAndCountAll(options);

		return {
			results: rows,
			count,
			totalPages: Math.ceil(count / limit),
		};
	}

	static generateIdentifier(): string {
		return crypto.randomBytes(4).toString('hex').toUpperCase();
	}

	static async generateUniqueIdentifier(): Promise<string> {
		let isUnique = false;
		let identifier = Patroller.generateIdentifier();
		while (!isUnique) {
			const existingPatroller = await Patroller.verifyIdentifier(identifier);
			if (!existingPatroller) {
				isUnique = true;
			}
			else {
				identifier = Patroller.generateIdentifier();
			}
		}
		return identifier;
	}

	static async verifyIdentifier(identifier: string): Promise<boolean> {
		const existingPatroller = await Patroller.findOne({ where: { identifier } });
		return !!existingPatroller;
	}
}

Patroller.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: () => uuidv4(),
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		identifier: {
			type: DataTypes.STRING(8),
			allowNull: false,
			unique: true,
		},
		email: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		phone: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		pin: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		failedPinAttempts: {
			type: DataTypes.INTEGER,
			allowNull: false,
			defaultValue: 0,
		},
		pinLockedUntil: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		siaLicenceNumber: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		siaLicenceType: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		siaLicenceExpiry: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		rightToWorkDocumentType: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		rightToWorkVerifiedAt: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		rightToWorkExpiry: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		workingTimeOptOut: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: false,
		},
		nationalInsuranceNumber: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		organizationId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
	},
	{
		sequelize,
		modelName: 'Patroller',
		hooks: {
			beforeCreate: async (patroller: Patroller) => {
				if (patroller.pin) {
					patroller.pin = await hashPassword(patroller.pin);
				}
			},
			beforeUpdate: async (patroller: Patroller) => {
				if (patroller.changed('pin') && patroller.pin) {
					patroller.pin = await hashPassword(patroller.pin);
				}
			},
		},
	}
);

Patroller.belongsTo(Organization, { foreignKey: 'organizationId' });
Organization.hasMany(Patroller, { foreignKey: 'organizationId' });
