import {Model, DataTypes, FindOptions} from 'sequelize';
import sequelize from '../db';
import { v4 as uuidv4 } from 'uuid';
import {PaginationOptions} from "../shared/domain/PaginationOptions";
import {PaginatedResults} from "../shared/domain/PaginatedResults";

interface AuditLogAttributes {
	id: string;
	organizationId: string;
	entityType: string;
	entityId: string;
	action: string;
	actorId?: string;
	actorType?: string;
	details?: string;
}

export class AuditLog extends Model<AuditLogAttributes> implements AuditLogAttributes {
	public id!: string;
	public organizationId!: string;
	public entityType!: string;
	public entityId!: string;
	public action!: string;
	public actorId?: string;
	public actorType?: string;
	public details?: string;

	public static async findByOrganizationId(
		organizationId: string,
		{ page = 1, limit = 25 }: PaginationOptions = { page: 1, limit: 25 },
		entityType?: string,
		entityId?: string,
	): Promise<PaginatedResults<AuditLog>> {
		const offset = (page - 1) * limit;

		const where: any = { organizationId };
		if (entityType) where.entityType = entityType;
		if (entityId) where.entityId = entityId;

		const options: FindOptions = {
			where,
			limit,
			offset,
			order: [['createdAt', 'DESC']],
		};

		const { count, rows } = await this.findAndCountAll(options);

		return {
			results: rows,
			count,
			totalPages: Math.ceil(count / limit),
		};
	}
}

AuditLog.init(
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
		entityType: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		entityId: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		action: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		actorId: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		actorType: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		details: {
			type: DataTypes.TEXT,
			allowNull: true,
			// Stored as a JSON string (MariaDB has no native JSON type); hand back a parsed object.
			get() {
				const raw = this.getDataValue('details');
				if (typeof raw !== 'string' || !raw) {
					return null;
				}
				try {
					return JSON.parse(raw);
				} catch {
					return raw;
				}
			},
		},
	},
	{
		sequelize,
		modelName: 'AuditLog',
		// Append-only by construction: no updatedAt column, and no route ever exposes an update/delete.
		updatedAt: false,
	}
);
