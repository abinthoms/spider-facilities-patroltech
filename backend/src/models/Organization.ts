import { Model, DataTypes, Association } from 'sequelize';
import sequelize from '../db';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Location } from './Location';

// Excludes visually-ambiguous characters (0/O, 1/I/L) so codes stay readable when typed on a phone.
const IDENTIFIER_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

interface OrganizationAttributes {
	id: string;
	identifier?: string;
	name: string;
	type: string;
}

export class Organization extends Model<OrganizationAttributes> implements OrganizationAttributes {
	public id!: string;
	public identifier?: string;
	public name!: string;
	public type!: string;

	// Añadir métodos de asociación
	public addLocation!: (location: Location, options?: any) => Promise<void>;
	public getLocations!: (options?: any) => Promise<Location[]>;
	public setLocations!: (locations: Location[], options?: any) => Promise<void>;
	public removeLocation!: (location: Location, options?: any) => Promise<void>;

	public static associations: {
		locations: Association<Organization, Location>;
	};

	static async findByPkOrIdentifier(organizationId: string) {
		return await this.findOne({where: {identifier: organizationId}}) || await this.findByPk(organizationId);
	}

	// Random, not sequential/guessable — a short org code is lower-entropy than a UUID,
	// so it must not also be low-randomness (e.g. derived from the org name).
	static generateIdentifier(length: number = 8): string {
		return Array.from(crypto.randomBytes(length))
			.map((byte) => IDENTIFIER_ALPHABET[byte % IDENTIFIER_ALPHABET.length])
			.join('');
	}

	static async generateUniqueIdentifier(): Promise<string> {
		let identifier = Organization.generateIdentifier();
		while (await Organization.findOne({ where: { identifier } })) {
			identifier = Organization.generateIdentifier();
		}
		return identifier;
	}
}

Organization.init(
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
		type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		identifier: {
			type: DataTypes.STRING,
			allowNull: true,
			unique: true,
		},
	},
	{
		sequelize,
		modelName: 'Organization',
	}
);
