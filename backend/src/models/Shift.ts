import {Model, DataTypes, Association, FindOptions, Op} from 'sequelize';
import sequelize from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './Organization';
import { Location } from './Location';
import { Patroller } from './Patroller';
import {PaginationOptions} from "../shared/domain/PaginationOptions";
import {PaginatedResults} from "../shared/domain/PaginatedResults";

interface ShiftAttributes {
	id: string;
	organizationId: string;
	locationId: string;
	patrollerId?: string;
	startTime: Date;
	endTime: Date;
	status: string;
	notes?: string;
	clockInAt?: Date;
	clockInLocation?: string;
	clockInWithinGeofence?: boolean;
	clockOutAt?: Date;
	clockOutLocation?: string;
	clockOutWithinGeofence?: boolean;
	workingTimeWarnings?: string;
}

export class Shift extends Model<ShiftAttributes> implements ShiftAttributes {
	public id!: string;
	public organizationId!: string;
	public locationId!: string;
	public patrollerId?: string;
	public startTime!: Date;
	public endTime!: Date;
	public status!: string;
	public notes?: string;
	public clockInAt?: Date;
	public clockInLocation?: string;
	public clockInWithinGeofence?: boolean;
	public clockOutAt?: Date;
	public clockOutLocation?: string;
	public clockOutWithinGeofence?: boolean;
	public workingTimeWarnings?: string;

	public static associations: {
		organization: Association<Shift, Organization>;
		location: Association<Shift, Location>;
		patroller: Association<Shift, Patroller>;
	};

	public static async findByOrganizationId(
		organizationId: string,
		{ page = 1, limit = 25 }: PaginationOptions = { page: 1, limit: 25 }
	): Promise<PaginatedResults<Shift>> {
		const offset = (page - 1) * limit;

		const options: FindOptions = {
			where: { organizationId },
			limit,
			offset,
			order: [['startTime', 'ASC']],
			include: [{ model: Location }, { model: Patroller }],
		};

		const { count, rows } = await this.findAndCountAll(options);

		return {
			results: rows,
			count,
			totalPages: Math.ceil(count / limit),
		};
	}

	public static async findByPatrollerId(
		patrollerId: string,
		{ page = 1, limit = 25 }: PaginationOptions = { page: 1, limit: 25 }
	): Promise<PaginatedResults<Shift>> {
		const offset = (page - 1) * limit;

		const options: FindOptions = {
			where: { patrollerId },
			limit,
			offset,
			order: [['startTime', 'ASC']],
			include: [{ model: Location }],
		};

		const { count, rows } = await this.findAndCountAll(options);

		return {
			results: rows,
			count,
			totalPages: Math.ceil(count / limit),
		};
	}

	public static async findActiveByOrganizationId(organizationId: string): Promise<Shift[]> {
		return this.findAll({
			where: {
				organizationId,
				clockInAt: { [Op.ne]: null },
				clockOutAt: null,
			} as any,
			order: [['clockInAt', 'DESC']],
			include: [{ model: Location }, { model: Patroller }],
		});
	}
}

Shift.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: () => uuidv4(),
			primaryKey: true,
		},
		organizationId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		locationId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		patrollerId: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		startTime: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		endTime: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'scheduled',
		},
		notes: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		clockInAt: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		clockInLocation: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		clockInWithinGeofence: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
		},
		clockOutAt: {
			type: DataTypes.DATE,
			allowNull: true,
		},
		clockOutLocation: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		clockOutWithinGeofence: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
		},
		workingTimeWarnings: {
			type: DataTypes.TEXT,
			allowNull: true,
			// Stored as a JSON string (MariaDB has no native JSON type); always hand back a parsed
			// array so callers (including GET /api/shifts, which has no manual override) see the
			// same shape as the POST/PUT responses. Same pattern as Checkpoint.tags.
			get() {
				const raw = this.getDataValue('workingTimeWarnings');
				if (typeof raw !== 'string' || !raw) {
					return [];
				}
				try {
					return JSON.parse(raw);
				} catch {
					return [];
				}
			},
		},
	},
	{
		sequelize,
		modelName: 'Shift',
	}
);

Shift.belongsTo(Organization, { foreignKey: 'organizationId' });
Organization.hasMany(Shift, { foreignKey: 'organizationId' });

Shift.belongsTo(Location, { foreignKey: 'locationId' });
Location.hasMany(Shift, { foreignKey: 'locationId' });

Shift.belongsTo(Patroller, { foreignKey: 'patrollerId' });
Patroller.hasMany(Shift, { foreignKey: 'patrollerId' });
