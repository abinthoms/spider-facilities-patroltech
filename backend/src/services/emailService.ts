import nodemailer from "nodemailer";
import { User } from "../models/User";
import * as fs from "node:fs";

// Configuración del cliente SMTP
const transporter = nodemailer.createTransport({
	host: process.env.SMTP_HOST,
	port: parseInt(process.env.SMTP_PORT || "587"),
	secure: process.env.SMTP_SECURE === "true",
	auth: {
		user: process.env.SMTP_USER,
		pass: process.env.SMTP_PASSWORD,
	},
});

const FROM_NAME = process.env.MAIL_FROM_NAME || "Spider Facilities";
const FROM_ADDRESS = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER || "";
const APP_URL = process.env.APP_URL || "https://portal.spiderfacilities.co.uk";

const sendCreateAccountEmail = async (user: User, password: string): Promise<void> => {
	let html = fs.readFileSync("src/assets/emails/new-account.html", "utf8");
	html = parseContent(html, { password, email: user.email, name: user.name, appUrl: APP_URL });

	let text = fs.readFileSync("src/assets/emails/new-account.txt", "utf8");
	text = parseContent(text, { password, email: user.email, name: user.name, appUrl: APP_URL });


	const mailOptions = {
		from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
		to: user.email,
		subject: "Welcome to Spider Facilities",
		text: text,
		html: html,
	};

	try {
		const info = await transporter.sendMail(mailOptions);
		console.log("Password email sent successfully", info.messageId);
	} catch (error) {
		console.error("Error sending password email:", error);
		throw new Error("Failed to send password email");
	}
};

const sendRecoverPasswordEmail = async (user: User, password: string): Promise<void> => {
	let html = fs.readFileSync("src/assets/emails/recover-password.html", "utf8");
	html = parseContent(html, { password, email: user.email, name: user.name, appUrl: APP_URL });

	let text = fs.readFileSync("src/assets/emails/recover-password.txt", "utf8");
	text = parseContent(text, { password, email: user.email, name: user.name, appUrl: APP_URL });

	const mailOptions = {
		from: `"${FROM_NAME}" <${FROM_ADDRESS}>`,
		to: user.email,
		subject: "Password Recovery",
		text: text,
		html: html,
	};

	try {
		const info = await transporter.sendMail(mailOptions);
		console.log("Password email sent successfully", info.messageId);
	} catch (error) {
		console.error("Error sending password email:", error);
		throw new Error("Failed to send password email");
	}
}

export { sendCreateAccountEmail, sendRecoverPasswordEmail };

function parseContent(content: string, data: any): string {
	let parsedContent = content;
	for (const key in data) {
		parsedContent = parsedContent.split(`{{${key}}}`).join(data[key]);
	}
	return parsedContent;
}
