/**
 * Real business details shown on the legal pages and in the site footer.
 *
 * Section 43 of the Electronic Communications and Transactions Act (ECTA) requires
 * a website that offers goods or services to show these details, and POPIA requires
 * the responsible party's contact details and an Information Officer.
 *
 * Fill in every field marked "required". Anything left empty is shown on the legal
 * pages as a highlighted "[Add: ...]" marker so it cannot be missed. Do not invent values.
 */
export interface BusinessDetails {
  tradingName: string;
  /** required: full registered name of the company / owner of the business */
  legalName: string;
  /** required: e.g. "Private company (Pty) Ltd", "Sole proprietor", "Non-profit company" */
  legalStatus: string;
  /** optional: CIPC registration number for a company, e.g. 2024/123456/07. Leave empty if not registered. */
  registrationNumber: string;
  /** optional: leave empty if not VAT-registered */
  vatNumber: string;
  /** required: physical address (also used for service of legal documents) */
  physicalAddress: string;
  /** optional: telephone number. Leave empty to show none. */
  phone: string;
  /** required: general contact email, also used for privacy and refund requests */
  email: string;
  /** required: POPIA Information Officer */
  informationOfficerName: string;
  /** required: POPIA Information Officer email (can be the same as `email`) */
  informationOfficerEmail: string;
  /** required: province/city whose courts have jurisdiction, e.g. "Johannesburg, Gauteng" */
  jurisdiction: string;
}

export const BUSINESS: BusinessDetails = {
  tradingName: 'FootLook',
  legalName: 'Mfundo Mthembu',
  legalStatus: 'Individual (sole proprietor)',
  registrationNumber: '',
  vatNumber: '',
  physicalAddress: 'Cape Town, Western Cape, South Africa',
  phone: '',
  email: 'mfundo1.mthembu@gmail.com',
  informationOfficerName: 'Mfundo Mthembu',
  informationOfficerEmail: 'mfundo1.mthembu@gmail.com',
  jurisdiction: 'Cape Town, Western Cape',
};

export const REQUIRED_BUSINESS_FIELDS: readonly (keyof BusinessDetails)[] = [
  'legalName',
  'legalStatus',
  'physicalAddress',
  'email',
  'informationOfficerName',
  'informationOfficerEmail',
  'jurisdiction',
];

export function missingBusinessDetails(): string[] {
  return REQUIRED_BUSINESS_FIELDS.filter((key) => !BUSINESS[key].trim());
}
