import {Model, DataTypes, Association, FindOptions} from 'sequelize';
import sequelize from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './Organization';
import { Location } from './Location';
import { Patroller } from './Patroller';
import {PaginationOptions} from "../shared/domain/PaginationOptions";
import {PaginatedResults} from "../shared/domain/PaginatedResults";

interface IncidentAttributes {
	id: string;
	organizationId: string;
	locationId?: string;
	patrollerId?: string;
	reportedByType: string;
	category: string;
	title: string;
	description: string;
	status: string;
	photo?: string;
	geolocation?: string;
	occurredAt: Date;
}

export class Incident extends Model<IncidentAttributes> implements IncidentAttributes {
	public id!: string;
	public organizationId!: string;
	public locationId?: string;
	public patrollerId?: string;
	public reportedByType!: string;
	public category!: string;
	public title!: string;
	public description!: string;
	public status!: string;
	public photo?: string;
	public geolocation?: string;
	public occurredAt!: Date;

	public static associations: {
		organization: Association<Incident, Organization>;
		location: Association<Incident, Location>;
		patroller: Association<Incident, Patroller>;
	};

	public static async findByOrganizationId(
		organizationId: string,
		{ page = 1, limit = 25 }: PaginationOptions = { page: 1, limit: 25 },
		status?: string
	): Promise<PaginatedResults<Incident>> {
		const offset = (page - 1) * limit;

		const where: any = { organizationId };
		if (status) {
			where.status = status;
		}

		const options: FindOptions = {
			where,
			limit,
			offset,
			order: [['occurredAt', 'DESC']],
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
	): Promise<PaginatedResults<Incident>> {
		const offset = (page - 1) * limit;

		const options: FindOptions = {
			where: { patrollerId },
			limit,
			offset,
			order: [['occurredAt', 'DESC']],
			include: [{ model: Location }],
		};

		const { count, rows } = await this.findAndCountAll(options);

		return {
			results: rows,
			count,
			totalPages: Math.ceil(count / limit),
		};
	}
}

Incident.init(
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
			allowNull: true,
		},
		patrollerId: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		reportedByType: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		category: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		title: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		description: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: 'open',
		},
		photo: {
			type: DataTypes.TEXT('long'),
			allowNull: true,
		},
		geolocation: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		occurredAt: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		sequelize,
		modelName: 'Incident',
	}
);

Incident.belongsTo(Organization, { foreignKey: 'organizationId' });
Organization.hasMany(Incident, { foreignKey: 'organizationId' });

Incident.belongsTo(Location, { foreignKey: 'locationId' });
Location.hasMany(Incident, { foreignKey: 'locationId' });

Incident.belongsTo(Patroller, { foreignKey: 'patrollerId' });
Patroller.hasMany(Incident, { foreignKey: 'patrollerId' });
