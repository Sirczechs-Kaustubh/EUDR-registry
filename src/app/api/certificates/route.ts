// src/app/api/certificates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import CertificateModel, { CertificateDocument } from '@/models/certificates';
import type { FilterQuery } from 'mongoose';

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildLooseRegex = (rawValue: string): RegExp => {
  const tokens = rawValue
    .trim()
    .split(/\s+/)
    .map(escapeRegex);

  const pattern = tokens.join('.*');
  return new RegExp(pattern, 'i');
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filter: FilterQuery<CertificateDocument> = {};
  const trim = (value: string | null): string | null =>
    value ? value.trim() : null;

  const id = trim(searchParams.get('id'));
  const certificateNumber = trim(searchParams.get('certificateNumber'));
  const holder = trim(searchParams.get('holder'));
  const search = trim(searchParams.get('search'));

  if (id) {
    filter.certificateNumber = id;
  }

  if (certificateNumber) {
    filter.certificateNumber = certificateNumber;
  }

  if (holder) {
    filter.certificateHolder = buildLooseRegex(holder);
  }

  const searchTerm = search ?? holder ?? null;

  if (searchTerm && !id && !certificateNumber) {
    const searchRegex = buildLooseRegex(searchTerm);

    filter.$or = [
      { certificateHolder: searchRegex },
      { certificateNumber: searchRegex },
      { complianceBody: searchRegex },
      { countryOfOrigin: searchRegex },
      { address: searchRegex },
    ];
  }

  const lookupIdentifier = id ?? certificateNumber ?? undefined;

  try {
    await dbConnect();

    const certificates = await CertificateModel.find(filter);

    if (!certificates || certificates.length === 0) {
      if (lookupIdentifier) {
        return NextResponse.json(
          { message: `Certificate ${lookupIdentifier} not found` },
          { status: 404 }
        );
      }

      return NextResponse.json([]);
    }

    if (id) {
      return NextResponse.json(certificates[0]);
    }

    return NextResponse.json(certificates);
  } catch (error) {
    console.error('Error fetching from MongoDB:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { message: 'Error fetching data', error: message },
      { status: 500 }
    );
  }
}
