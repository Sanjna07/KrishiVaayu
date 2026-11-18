import { NextResponse } from 'next/server';
import { marketRepo } from '@/lib/repo/marketRepo';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import type { ReportReason, ReporterType, ReportTargetType } from '@/types/market';

const VALID_REASONS: ReportReason[] = [
  'no_show_pickup',
  'incorrect_quantity_quality',
  'payment_issue',
  'unresponsive_contact',
  'fake_listing_or_bid',
  'inappropriate_behavior',
  'other',
];

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = checkRateLimit(ip, 20);
    if (!rl.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { reporterType, reporterId, targetType, targetId, targetName, reason, notes } = body;

    if (reporterType !== 'farmer' && reporterType !== 'buyer') {
      return NextResponse.json({ error: "reporterType must be either 'farmer' or 'buyer'" }, { status: 400 });
    }

    if (typeof reporterId !== 'string' || !reporterId.trim()) {
      return NextResponse.json({ error: 'reporterId is required' }, { status: 400 });
    }

    if (targetType !== 'farmer' && targetType !== 'buyer') {
      return NextResponse.json({ error: "targetType must be either 'farmer' or 'buyer'" }, { status: 400 });
    }

    if (typeof targetId !== 'string' || !targetId.trim()) {
      return NextResponse.json({ error: 'targetId is required' }, { status: 400 });
    }

    if (!VALID_REASONS.includes(reason as ReportReason)) {
      return NextResponse.json({ error: `Invalid report reason: ${reason}` }, { status: 400 });
    }

    const result = await marketRepo.createReport({
      reporterType: reporterType as ReporterType,
      reporterId: reporterId.trim().slice(0, 100),
      targetType: targetType as ReportTargetType,
      targetId: targetId.trim().slice(0, 100),
      targetName: typeof targetName === 'string' ? targetName.trim().slice(0, 100) : undefined,
      reason: reason as ReportReason,
      notes: typeof notes === 'string' ? notes.trim().slice(0, 500) : undefined,
    });

    if (result.duplicate) {
      return NextResponse.json(
        { error: 'You have already submitted a report against this party. Duplicate reports are prevented.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: result.flagged
          ? 'Report recorded. This party has received more than 3 reports and has been automatically flagged for admin verification and blacklisting.'
          : 'Report recorded. Thank you for keeping the KrishiVayu marketplace fair and trustworthy.',
        flagged: result.flagged,
        reportId: result.report.id,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to process report';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const targetId = url.searchParams.get('targetId');
    if (!targetId) {
      return NextResponse.json({ error: 'targetId query parameter is required' }, { status: 400 });
    }

    const reports = await marketRepo.getReportsByTargetId(targetId);
    return NextResponse.json({
      success: true,
      count: reports.length,
      isFlagged: reports.length > 3,
      reports,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch reports';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
