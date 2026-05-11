import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
	try {
		const { email } = await request.json();

		if (!email || !email.includes('@')) {
			return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
		}

		// 检查邮箱是否已注册
		const existingUser = await prisma.user.findUnique({
			where: { email },
		});

		if (existingUser) {
			return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
		}

		// 生成 6 位验证码
		const code = String(Math.floor(100000 + Math.random() * 900000));
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期

		// 删除旧的验证记录
		await prisma.emailVerification.deleteMany({
			where: { email },
		});

		// 创建新的验证记录
		await prisma.emailVerification.create({
			data: {
				email,
				token: code,
				expiresAt,
			},
		});

		// 发送验证码邮件
		const port = parseInt(process.env.EMAIL_PORT || '587', 10);
		const secure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : port === 465;
		const transporter = nodemailer.createTransport({
			host: process.env.EMAIL_HOST,
			port,
			secure,
			auth: {
				user: process.env.EMAIL_USER,
				pass: process.env.EMAIL_PASS,
			},
			tls: {
				rejectUnauthorized: false,
			},
			connectionTimeout: 30000,
			greetingTimeout: 30000,
			socketTimeout: 30000,
		});

		const fromAddress = process.env.EMAIL_FROM?.includes('@')
			? process.env.EMAIL_FROM
			: `"${process.env.EMAIL_FROM || 'TripFareCalc'}" <${process.env.EMAIL_USER}>`;

		await transporter.sendMail({
			from: fromAddress,
			to: email,
			subject: '验证码登录 - 旅行账单计算器',
			html: `
        <p>您的验证码为：</p>
        <p style="font-size: 24px; font-weight: bold;">${code}</p>
        <p>该验证码 24 小时内有效。</p>
      `,
		});

		return NextResponse.json({ message: 'Verification code sent' });
	} catch (error) {
		console.error('Register email error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
