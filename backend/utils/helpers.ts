export const generateCode = (prefix: string, length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = prefix + '-';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const generatePONumber = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PO-${year}${month}-${random}`;
};

export const generateCode_with_timestamp = (prefix: string): string => {
  const ts = Date.now().toString().slice(-6);
  return `${prefix}-${ts}`;
};

export const formatDate = (date: any): string | null => {
  if (!date) return null;
  return new Date(date).toISOString().split('T')[0];
};

export const sanitizeInput = (str: any): any => {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
};

export interface ParsedFilters {
  page: number;
  limit: number;
  offset: number;
  search: string;
  sort: string;
  order: 'asc' | 'desc';
}

export const parseFilters = (query: any): ParsedFilters => {
  const { page = 1, limit = 10, search = '', sort = 'createdAt', order = 'desc' } = query;
  const parsedPage = parseInt(page as string, 10) || 1;
  const parsedLimit = parseInt(limit as string, 10) || 10;
  const offset = (parsedPage - 1) * parsedLimit;
  
  return {
    page: parsedPage,
    limit: parsedLimit,
    offset,
    search: sanitizeInput(search),
    sort: sanitizeInput(sort),
    order: String(order).toLowerCase() === 'asc' ? 'asc' : 'desc'
  };
};
