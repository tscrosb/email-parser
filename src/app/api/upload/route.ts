import { NextResponse } from 'next/server';
import { simpleParser, AddressObject } from 'mailparser';

//helper function to format email addresses
function formatAddresses(addressObj: AddressObject | AddressObject[] | undefined): string {
  if (!addressObj) return 'Unknown';
  
  const addr = Array.isArray(addressObj) ? addressObj[0] : addressObj;
  
  if (!addr) return 'Unknown';
  
  return addr.value.map(item => {
    if (item.name) {
      return `${item.name} <${item.address}>`;
    }
    return item.address;
  }).join(', ');
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    const parsed = await simpleParser(buffer);

    const emailData = {
      sender: formatAddresses(parsed.from),
      recipients: formatAddresses(parsed.to),
      subject: parsed.subject || 'No Subject',
      date: parsed.date?.toISOString() || new Date().toISOString(),
      body: parsed.text || parsed.html || 'No content',
      cc: formatAddresses(parsed.cc),
      bcc: formatAddresses(parsed.bcc),
      messageId: parsed.messageId || '',
    };

    return NextResponse.json(emailData);
  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: 'Failed to parse email file' },
      { status: 500 }
    );
  }
}