// src/models/certificates.ts
import mongoose, { InferSchemaType, Model } from 'mongoose';

const CertificateSchema = new mongoose.Schema({
  certificateNumber: {
    type: String,
    required: [true, 'Please provide a certificate number.'],
    unique: true,
    trim: true,
  },
  certificateHolder: {
    type: String,
    required: [true, 'Please provide the certificate holder name.'],
  },
  address: {
    type: String,
  },
  dateOfIssue: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Valid', 'Expired', 'Revoked'],
    default: 'Valid',
  },
  complianceBody: {
    type: String,
    default: 'Dilify',
  },
  countryOfOrigin: {
    type: String,
  },
  certificateCanvaLink: {
    type: String,
    required: [true, 'Please provide a Canva link.'],
  },
});

export type CertificateDocument = InferSchemaType<typeof CertificateSchema>;

const CertificateModel =
  (mongoose.models.Certificate as Model<CertificateDocument> | undefined) ??
  mongoose.model<CertificateDocument>('Certificate', CertificateSchema);

export default CertificateModel;
