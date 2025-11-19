export interface ParsedMessage {
  sender: string;
  date: string;
  body: string;
  order: number; // 0 = newest, 1 = previous, etc.
}

export interface EmailChain {
  subject: string;
  messages: ParsedMessage[];
}

// Common email chain delimiters
const CHAIN_PATTERNS = [
  // "On [date], [person] wrote:"
  /On\s+(.+?)\s+at\s+(.+?),?\s+(.+?)\s+<?([^>]+)>?\s+wrote:/gi,
  
  // "From: [person]\nSent: [date]"
  /From:\s*(.+?)\s*[\r\n]+(?:Sent|Date):\s*(.+?)[\r\n]/gi,
  
  // "-----Original Message-----"
  /[-_]{3,}\s*Original Message\s*[-_]{3,}/gi,
  
  // "> " quoted replies
  /(?:^|\n)>{1,}\s*.+/gm,
];

const DATE_PATTERNS = [
  // "On Nov 15, 2024, at 10:30 AM"
  /On\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4}[^,]*)/i,
  
  // "Sent: Monday, November 15, 2024 10:30 AM"
  /(?:Sent|Date):\s*(.+?)(?:\r?\n|$)/i,
];

const SENDER_PATTERNS = [
  // "John Doe <john@example.com>"
  /(.+?)\s*<([^>]+)>/,
  
  // "From: John Doe"
  /From:\s*(.+?)(?:\r?\n|$)/i,
];

export function parseEmailChain(emailBody: string, subject: string): EmailChain {
  // Split by common patterns
  const splitMessages = splitByPatterns(emailBody);
  
  if (splitMessages.length === 1) {
    // No chain detected - single message
    return {
      subject,
      messages: [{
        sender: 'Unknown',
        date: new Date().toISOString(),
        body: emailBody.trim(),
        order: 0,
      }],
    };
  }

  // Parse each message
  const messages: ParsedMessage[] = splitMessages.map((msg, index) => {
    const sender = extractSender(msg);
    const date = extractDate(msg);
    const body = cleanMessageBody(msg);

    return {
      sender,
      date,
      body,
      order: index,
    };
  });

  return {
    subject,
    messages,
  };
}

function splitByPatterns(text: string): string[] {
  // Try splitting by "On [date], [person] wrote:"
  let parts = text.split(/(?=On\s+.+?at\s+.+?,?\s+.+?wrote:)/i);
  
  if (parts.length > 1) {
    return parts.filter(p => p.trim().length > 0);
  }

  // Try splitting by "From:...Sent:" pattern
  parts = text.split(/(?=From:\s*.+?[\r\n]+(?:Sent|Date):)/i);
  
  if (parts.length > 1) {
    return parts.filter(p => p.trim().length > 0);
  }

  // Try splitting by "-----Original Message-----"
  parts = text.split(/[-_]{3,}\s*Original Message\s*[-_]{3,}/i);
  
  if (parts.length > 1) {
    return parts.filter(p => p.trim().length > 0);
  }

  // Try splitting by multiple blank lines (last resort)
  parts = text.split(/\n\s*\n\s*\n/);
  
  if (parts.length > 1 && parts.every(p => p.length > 20)) {
    return parts.filter(p => p.trim().length > 0);
  }

  // No pattern found - return as single message
  return [text];
}

function extractSender(text: string): string {
  // Try "Name <email>" pattern
  const emailMatch = text.match(/(.+?)\s*<([^>]+)>/);
  if (emailMatch) {
    return `${emailMatch[1].trim()} <${emailMatch[2].trim()}>`;
  }

  // Try "From: Name" pattern
  const fromMatch = text.match(/From:\s*(.+?)(?:\r?\n|$)/i);
  if (fromMatch) {
    return fromMatch[1].trim();
  }

  // Try to find email address anywhere
  const emailOnly = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
  if (emailOnly) {
    return emailOnly[1];
  }

  return 'Unknown';
}

function extractDate(text: string): string {
  // Try "On [date] at [time]" pattern
  const onDateMatch = text.match(/On\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4}[^,]*at[^,\n]+)/i);
  if (onDateMatch) {
    try {
      return new Date(onDateMatch[1]).toISOString();
    } catch {
      return onDateMatch[1];
    }
  }

  // Try "Sent: [date]" pattern
  const sentMatch = text.match(/(?:Sent|Date):\s*(.+?)(?:\r?\n|$)/i);
  if (sentMatch) {
    try {
      return new Date(sentMatch[1]).toISOString();
    } catch {
      return sentMatch[1];
    }
  }

  return new Date().toISOString();
}

function cleanMessageBody(text: string): string {
  // Remove the header line (On...wrote: or From:...Sent:)
  let cleaned = text.replace(/^On\s+.+?wrote:\s*/i, '');
  cleaned = cleaned.replace(/^From:\s*.+?[\r\n]+(?:Sent|Date):.+?[\r\n]+/i, '');
  cleaned = cleaned.replace(/^[-_]{3,}\s*Original Message\s*[-_]{3,}\s*/i, '');
  
  // Remove excessive quoted text (lines starting with >)
  const lines = cleaned.split('\n');
  const nonQuotedLines = lines.filter(line => !line.trim().startsWith('>'));
  
  // If we removed too much, keep original
  if (nonQuotedLines.length < 2 && lines.length > 5) {
    return cleaned.trim();
  }
  
  return nonQuotedLines.join('\n').trim();
}