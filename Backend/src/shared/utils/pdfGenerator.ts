import { Buffer } from 'buffer';

class SimplePDF {
    private lines: string[] = [];
    private y: number = 780;

    addText(text: string, size: number = 10, isBold: boolean = false, x: number = 50) {
        const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
        const font = isBold ? '/F2' : '/F1';
        this.lines.push(`BT ${font} ${size} Tf ${x} ${this.y} Td (${escaped}) Tj ET`);
        this.y -= (size + 8);
    }

    addSpacer(units: number = 10) {
        this.y -= units;
    }

    addLine(x1: number, y1: number, x2: number, y2: number, width: number = 1) {
        this.lines.push(`${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
    }

    getY() {
        return this.y;
    }

    build(): Buffer {
        const contentStream = this.lines.join('\n');
        
        // Catalog and Pages
        const catalog = `<< /Type /Catalog /Pages 2 0 R >>`;
        const pages = `<< /Type /Pages /Kids [3 0 R] /Count 1 >>`;
        const page = `<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 595 842] /Contents 5 0 R >>`;
        const resources = `<< /Font << 
            /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> 
            /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> 
        >> >>`;
        
        const streamHeader = `<< /Length ${contentStream.length} >>\nstream\n`;
        const streamFooter = `\nendstream`;
        const contents = streamHeader + contentStream + streamFooter;

        const pdfParts: string[] = [];
        pdfParts.push("%PDF-1.4\n");
        
        const offsets: number[] = [];
        let currentOffset = 9; // Size of %PDF-1.4\n
        
        const addObj = (index: number, content: string) => {
            offsets[index] = currentOffset;
            const objText = `${index} 0 obj\n${content}\nendobj\n`;
            pdfParts.push(objText);
            currentOffset += objText.length;
        };

        addObj(1, catalog);
        addObj(2, pages);
        addObj(3, page);
        addObj(4, resources);
        addObj(5, contents);

        const startxref = currentOffset;
        
        let xref = `xref\n0 6\n0000000000 65535 f \n`;
        for (let i = 1; i <= 5; i++) {
            const offsetStr = String(offsets[i]).padStart(10, '0');
            xref += `${offsetStr} 00000 n \n`;
        }
        
        pdfParts.push(xref);
        pdfParts.push(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`);
        
        return Buffer.from(pdfParts.join(''), 'utf-8');
    }
}

/**
 * Generate expense summary PDF in-memory.
 */
export function generateExpensePDF(
    groupName: string, 
    totalSpend: number, 
    expenses: any[], 
    settlements: any[], 
    balances: any[]
): Buffer {
    const pdf = new SimplePDF();
    
    // Header banner
    pdf.addText("AdventureNexus - Expense Summary Report", 16, true, 50);
    pdf.addLine(50, pdf.getY() + 10, 545, pdf.getY() + 10, 2);
    pdf.addSpacer(15);
    
    // Group Metadata details
    pdf.addText(`Group Trip: ${groupName}`, 12, true);
    pdf.addText(`Total Group Spend: $${totalSpend.toFixed(2)}`, 11, true);
    pdf.addText(`Report Generated: ${new Date().toLocaleString()}`, 9, false);
    pdf.addSpacer(20);
    
    // Section 1: Balances Table
    pdf.addText("Net Standings", 13, true);
    pdf.addLine(50, pdf.getY() + 6, 545, pdf.getY() + 6, 1);
    pdf.addSpacer(10);
    
    for (const b of balances) {
        const name = b.userId?.fullname || b.userId?.username || 'Traveler';
        const balance = b.netBalance;
        const text = balance > 0 
            ? `${name} is owed: $${balance.toFixed(2)}`
            : balance < 0 
                ? `${name} owes: $${Math.abs(balance).toFixed(2)}`
                : `${name} is settled up`;
        pdf.addText(text, 10, false, 60);
    }
    pdf.addSpacer(20);
    
    // Section 2: Settlements
    pdf.addText("Suggested Settlements (Who pays whom)", 13, true);
    pdf.addLine(50, pdf.getY() + 6, 545, pdf.getY() + 6, 1);
    pdf.addSpacer(10);
    
    if (settlements.length === 0) {
        pdf.addText("All members are settled up! No transactions needed.", 10, false, 60);
    } else {
        for (const s of settlements) {
            const fromName = s.from?.fullname || s.from?.username || 'Traveler';
            const toName = s.to?.fullname || s.to?.username || 'Traveler';
            pdf.addText(`${fromName} pays $${s.amount.toFixed(2)} to ${toName}`, 10, false, 60);
        }
    }
    pdf.addSpacer(20);
    
    // Section 3: Expense Log
    pdf.addText("Expense Log", 13, true);
    pdf.addLine(50, pdf.getY() + 6, 545, pdf.getY() + 6, 1);
    pdf.addSpacer(10);
    
    if (expenses.length === 0) {
        pdf.addText("No expenses logged yet.", 10, false, 60);
    } else {
        for (const e of expenses) {
            const desc = e.description || 'Expense';
            const paidByName = e.paidBy?.fullname || e.paidBy?.username || 'Someone';
            const amt = e.amount;
            const dateStr = new Date(e.createdAt || new Date()).toLocaleDateString();
            pdf.addText(`${desc} - $${amt.toFixed(2)} paid by ${paidByName} on ${dateStr}`, 10, false, 60);
        }
    }
    
    return pdf.build();
}
