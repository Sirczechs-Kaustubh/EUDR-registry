// src/app/page.tsx
'use client';

import Image from 'next/image';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type RefObject,
} from 'react';
import styles from './page.module.css';

type CertificateStatus = 'Valid' | 'Expired' | 'Revoked' | string;

type Certificate = {
  _id?: string;
  certificateNumber?: string;
  certificateHolder?: string;
  address?: string;
  dateOfIssue?: string;
  status?: CertificateStatus;
  complianceBody?: string;
  countryOfOrigin?: string;
  certificateCanvaLink?: string;
};

type ApiMessage = { message: string; error?: string };
type ApiResponse = Certificate | Certificate[] | ApiMessage;

type SearchSectionProps = {
  searchTerm: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFetchAll: () => void;
  loading: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
};

type CertificateCardProps = {
  certificate: Certificate;
  onViewCertificate: (certificate: Certificate) => void;
};

type CertificateModalProps = {
  certificate: Certificate;
  onClose: () => void;
  onDownload: () => void;
  downloading: boolean;
  downloadError: string | null;
};

type StatusTheme = {
  label: string;
  cssVars: CSSProperties;
};

const isApiMessage = (value: unknown): value is ApiMessage =>
  typeof value === 'object' &&
  value !== null &&
  'message' in value &&
  typeof (value as ApiMessage).message === 'string';

const isCertificate = (value: unknown): value is Certificate =>
  typeof value === 'object' && value !== null;

const getCanvaEmbedUrl = (value?: string): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!url.searchParams.has('embed')) {
      url.searchParams.set('embed', 'true');
    }
    return url.toString();
  } catch {
    return null;
  }
};

const formatDate = (value?: string): string | undefined => {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const createStatusTheme = (
  label: string,
  background: string,
  foreground: string,
  border: string
): StatusTheme => ({
  label,
  cssVars: {
    '--status-bg': background,
    '--status-fg': foreground,
    '--status-border': border,
  } as CSSProperties,
});

const STATUS_THEME_MAP: Record<string, StatusTheme> = {
  Valid: createStatusTheme('Valid', '#ecfdf3', '#027a48', 'rgba(2, 122, 72, 0.2)'),
  Expired: createStatusTheme('Expired', '#fff7ed', '#9a3412', 'rgba(250, 146, 70, 0.35)'),
  Revoked: createStatusTheme('Revoked', '#fef2f2', '#b91c1c', 'rgba(248, 113, 113, 0.4)'),
};

const resolveStatusTheme = (status?: CertificateStatus): StatusTheme => {
  if (!status) return STATUS_THEME_MAP.Valid;
  const fallback = createStatusTheme(
    status,
    '#eef2ff',
    '#1e3a8a',
    'rgba(59, 130, 246, 0.35)'
  );
  return STATUS_THEME_MAP[status] ?? fallback;
};

const SearchSection = ({
  searchTerm,
  onChange,
  onSubmit,
  onFetchAll,
  loading,
  inputRef,
}: SearchSectionProps) => (
  <section className={styles.searchSection}>
    <header className={styles.searchHeader}>
      <div className={styles.logoRow}>
        <Image
          src="/dilify-logo.svg"
          alt="Dilify logo"
          width={164}
          height={48}
          priority
        />
        <span className={styles.pill}>Dilify Compliance Toolkit</span>
      </div>
      <div className={styles.headingGroup}>
        <h1>EUDR Certificate Intelligence</h1>
        <p>
          Search Dilify&apos;s registry to validate certificate holders, numbers,
          origins, and compliance status in seconds.
        </p>
      </div>
    </header>

    <form className={styles.searchForm} onSubmit={onSubmit}>
      <div className={styles.inputWrapper}>
        <span className={styles.searchIcon} aria-hidden="true">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.16667 15.8333C12.8486 15.8333 15.8333 12.8486 15.8333 9.16667C15.8333 5.48477 12.8486 2.5 9.16667 2.5C5.48477 2.5 2.5 5.48477 2.5 9.16667C2.5 12.8486 5.48477 15.8333 9.16667 15.8333Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17.5 17.5L13.875 13.875"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <input
          ref={inputRef}
          id="certificate-search"
          name="certificate-search"
          type="search"
          autoComplete="off"
          placeholder="Search by holder, certificate number, address..."
          value={searchTerm}
          onChange={onChange}
          aria-label="Search certificates"
          className={styles.searchInput}
        />
        <span className={styles.shortcut} aria-hidden="true">
          Ctrl + K
        </span>
      </div>

      <button
        type="submit"
        className={styles.primaryAction}
        disabled={loading}
      >
        {loading ? 'Searching...' : 'Search registry'}
      </button>

      <div className={styles.formFooter}>
        <button
          type="button"
          onClick={onFetchAll}
          className={styles.secondaryAction}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Fetch all certificates'}
        </button>
      </div>
    </form>
  </section>
);

const CertificateCard = ({
  certificate,
  onViewCertificate,
}: CertificateCardProps) => {
  const issuedOn = formatDate(certificate.dateOfIssue);
  const statusTheme = resolveStatusTheme(certificate.status);
  const details: Array<{ label: string; value: string }> = [
    {
      label: 'Holder',
      value: certificate.certificateHolder ?? 'Unknown holder',
    },
    {
      label: 'Address',
      value: certificate.address ?? 'No address on record',
    },
    {
      label: 'Origin',
      value: certificate.countryOfOrigin ?? 'Origin unavailable',
    },
    {
      label: 'Compliance body',
      value: certificate.complianceBody ?? 'Not specified',
    },
  ];

  if (issuedOn) {
    details.push({ label: 'Issued', value: issuedOn });
  }

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <span className={styles.label}>Certificate</span>
          <p className={styles.certificateId}>
            {certificate.certificateNumber ?? 'Unavailable'}
          </p>
        </div>
        <span className={styles.statusPill} style={statusTheme.cssVars}>
          Status: {statusTheme.label}
        </span>
      </header>

      <div className={styles.cardBody}>
        {details.map((item) => (
          <div key={item.label} className={styles.cardRow}>
            <span className={styles.label}>{item.label}</span>
            <span className={styles.value}>{item.value}</span>
          </div>
        ))}
      </div>

      <footer className={styles.cardFooter}>
        {certificate.certificateCanvaLink ? (
          <button
            type="button"
            onClick={() => onViewCertificate(certificate)}
            className={styles.viewLink}
          >
            View Certificate
            <span aria-hidden="true">&rarr;</span>
          </button>
        ) : (
          <span className={styles.value}>No preview available</span>
        )}
      </footer>
    </article>
  );
};

const CertificateModal = ({
  certificate,
  onClose,
  onDownload,
  downloading,
  downloadError,
}: CertificateModalProps) => {
  const embedUrl = getCanvaEmbedUrl(certificate.certificateCanvaLink);
  const statusTheme = resolveStatusTheme(certificate.status);

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="certificate-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.modalHeader}>
          <div className={styles.modalTitleGroup}>
            <span>CERTIFICATE PREVIEW</span>
            <h3 id="certificate-preview-title">
              {certificate.certificateNumber ?? 'Certificate'}
            </h3>
            <p>
              Holder: {certificate.certificateHolder ?? 'Unknown holder'}
            </p>
          </div>

          <div className={styles.modalActions}>
            <span className={styles.statusPill} style={statusTheme.cssVars}>
              Status: {statusTheme.label}
            </span>
            <button
              type="button"
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close certificate preview"
            >
              &times;
            </button>
         </div>
       </header>

        <div className={styles.modalBody}>
          <div className={styles.certificateFrame}>
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title={`Certificate ${certificate.certificateNumber ?? ''}`}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.certificatePlaceholder}>
                Certificate preview unavailable. Open the original design to
                view the document.
              </div>
            )}
          </div>
        </div>

        <footer className={styles.modalFooter}>
          <p className={styles.helperText}>
            Download a copy of this certificate for your records.
          </p>
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading || !certificate.certificateCanvaLink}
            className={styles.downloadButton}
          >
            {downloading ? 'Preparing download...' : 'Download PDF'}
          </button>
          {downloadError && (
            <p className={styles.errorMessage}>{downloadError}</p>
          )}
        </footer>
      </div>
    </div>
  );
};

export default function Home() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(
    null
  );
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const normalizeResponse = (data: ApiResponse) => {
    if (Array.isArray(data)) {
      const filtered = data.filter(isCertificate);
      setCertificates(filtered);
      setInfoMessage(filtered.length ? null : 'No certificates found.');
      return;
    }

    if (isApiMessage(data)) {
      setCertificates([]);
      setInfoMessage(data.message);
      return;
    }

    if (isCertificate(data)) {
      setCertificates([data]);
      setInfoMessage(null);
      return;
    }

    setCertificates([]);
    setInfoMessage('No certificates found.');
  };

  const fetchAll = async (): Promise<void> => {
    setLoading(true);
    setInfoMessage(null);
    setCertificates([]);
    setHasSearched(true);

    try {
      const res = await fetch('/api/certificates');
      const data: ApiResponse = await res.json();
      normalizeResponse(data);
    } catch (error) {
      console.error('Failed to fetch certificates', error);
      setInfoMessage('Unable to reach the certificate service right now.');
    } finally {
      setLoading(false);
    }
  };

  const searchCertificates = async (): Promise<void> => {
    const trimmedTerm = searchTerm.trim();
    if (!trimmedTerm) {
      setInfoMessage('Enter a holder name, certificate number, or location.');
      setCertificates([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setInfoMessage(null);
    setCertificates([]);
    setHasSearched(true);

    try {
      const query = encodeURIComponent(trimmedTerm);
      const res = await fetch(`/api/certificates?search=${query}`);
      const data: ApiResponse = await res.json();
      normalizeResponse(data);
    } catch (error) {
      console.error('Failed to search certificates', error);
      setInfoMessage('Unable to search certificates right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void searchCertificates();
  };

  const handleOpenCertificate = (certificate: Certificate) => {
    setActiveCertificate(certificate);
    setDownloadError(null);
  };

  const handleCloseCertificate = () => {
    setActiveCertificate(null);
    setDownloadError(null);
  };

  useEffect(() => {
    if (!activeCertificate) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseCertificate();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeCertificate]);

  useEffect(() => {
    if (!activeCertificate) {
      setDownloading(false);
    }
  }, [activeCertificate]);

  useEffect(() => {
    const handleHotKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleHotKey);
    return () => window.removeEventListener('keydown', handleHotKey);
  }, []);

  const handleDownloadCertificate = async () => {
    if (!activeCertificate?.certificateCanvaLink) return;

    setDownloading(true);
    setDownloadError(null);

    const sourceUrl = activeCertificate.certificateCanvaLink;

    try {
      const response = await fetch(sourceUrl);

      if (!response.ok) {
        throw new Error(`Failed to fetch certificate: ${response.statusText}`);
      }

      const blob = await response.blob();
      const contentType = response.headers.get('content-type') ?? '';
      const extension = contentType.includes('pdf')
        ? 'pdf'
        : contentType.includes('png')
        ? 'png'
        : contentType.includes('jpeg')
        ? 'jpg'
        : 'bin';

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${activeCertificate.certificateNumber ?? 'certificate'}.${extension}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Direct download failed, opening original Canva link.', error);
      setDownloadError(
        'Canva only allows downloads from within their interface. Opening the design in a new tab.'
      );
      window.open(sourceUrl, '_blank', 'noopener');
    } finally {
      setDownloading(false);
    }
  };

  const resultsSubtitle = useMemo(() => {
    if (loading) return 'Hang tight while we reach the compliance vault...';
    if (infoMessage) return infoMessage;
    if (certificates.length === 0 && hasSearched) {
      return 'No matches yet - try refining your search.';
    }
    if (certificates.length > 1) {
      return `${certificates.length} certificates matched your query.`;
    }
    if (certificates.length === 1) {
      return 'One certificate matches your query.';
    }
    return 'Pull recent certificates or search across holders, numbers, and more.';
  }, [certificates.length, hasSearched, infoMessage, loading]);

  const resultsCountLabel = useMemo(() => {
    if (loading) return 'Searching registry...';
    if (certificates.length > 1) return `${certificates.length} results`;
    if (certificates.length === 1) return '1 result';
    if (hasSearched) return '0 results';
    return 'Awaiting search';
  }, [certificates.length, hasSearched, loading]);

  const showEmptyState = !loading && certificates.length === 0 && hasSearched;

  return (
    <main className={styles.page}>
      <div className={styles.wrapper}>
        <SearchSection
          searchTerm={searchTerm}
          onChange={handleSearchChange}
          onSubmit={handleSubmit}
          onFetchAll={fetchAll}
          loading={loading}
          inputRef={searchInputRef}
        />

        <section className={styles.resultsSection}>
          <header className={styles.resultsHeader}>
            <div className={styles.resultsHeading}>
              <span className={styles.resultsLabel}>Registry overview</span>
              <h2>Certificate Registry</h2>
              <p className={styles.resultsSubtitle} aria-live="polite">
                {resultsSubtitle}
              </p>
            </div>
            <div className={styles.resultsMeta}>
              <span className={styles.resultsBadge} aria-live="polite">
                {resultsCountLabel}
              </span>
              {!hasSearched && (
                <div className={styles.resultsHint}>
                  Run a query or fetch all certificates to populate results.
                </div>
              )}
            </div>
          </header>

          {certificates.length > 0 && (
            <div className={styles.cardGrid}>
              {certificates.map((certificate, index) => {
                const key =
                  certificate._id ??
                  certificate.certificateNumber ??
                  `certificate-${index}`;
                return (
                  <CertificateCard
                    key={key}
                    certificate={certificate}
                    onViewCertificate={handleOpenCertificate}
                  />
                );
              })}
            </div>
          )}

          {showEmptyState && (
            <div className={styles.emptyState}>{resultsSubtitle}</div>
          )}
        </section>
      </div>

      {activeCertificate && (
        <CertificateModal
          certificate={activeCertificate}
          onClose={handleCloseCertificate}
          onDownload={handleDownloadCertificate}
          downloading={downloading}
          downloadError={downloadError}
        />
      )}
    </main>
  );
}
