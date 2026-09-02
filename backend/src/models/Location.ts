import { Model, DataTypes, Association } from 'sequelize';
import sequelize from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from './Organization';

interface LocationAttributes {
	id: string;
	address: string;
	latitude?: number;
	longitude?: number;
	owner: string;
	portalToken?: string;
}

export class Location extends Model<LocationAttributes> implements LocationAttributes {
	public id!: string;
	public address!: string;
	public latitude?: number;
	public longitude?: number;
	public owner!: string;
	public portalToken?: string;

	// Añadir métodos de asociación
	public addOrganization!: (organization: Organization, options?: any) => Promise<void>;
	public getOrganizations!: (options?: any) => Promise<Organization[]>;
	public setOrganizations!: (organizations: Organization[], options?: any) => Promise<void>;
	public removeOrganization!: (organization: Organization, options?: any) => Promise<void>;

	public static associations: {
		organizations: Association<Location, Organization>;
	};
}

Location.init(
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: () => uuidv4(),
			primaryKey: true,
		},
		address: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		latitude: {
			type: DataTypes.FLOAT,
			allowNull: true,
		},
		longitude: {
			type: DataTypes.FLOAT,
			allowNull: true,
		},
		owner: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		portalToken: {
			type: DataTypes.STRING(48),
			allowNull: true,
			unique: true,
		},
	},
	{
		sequelize,
		modelName: 'Location',
	}
);

// Definir las asociaciones
Location.belongsToMany(Organization, { through: 'OrganizationLocations' });
Organization.belongsToMany(Location, { through: 'OrganizationLocations' });
