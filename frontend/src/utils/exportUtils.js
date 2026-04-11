import * as XLSX from "xlsx";

/**
 * Exports data to an Excel file (.xlsx)
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file (without extension)
 * @param {string} sheetName - Name of the worksheet
 */
export const exportToExcel = (data, fileName = "FinTrack_Data", sheetName = "Transactions") => {
    try {
        if (!data || data.length === 0) {
            console.warn("No data to export");
            return;
        }

        // 1. Create a new workbook and worksheet
        const workbook = XLSX.utils.book_new();
        
        // 2. Transform data if needed (e.g., formatting dates, rounding numbers)
        const formattedData = data.map(item => ({
            Date: new Date(item.date).toLocaleDateString(),
            Category: item.category || "Other",
            Note: item.note || "-",
            Type: item.type || "Expense",
            Amount: Number(item.amount) || 0
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedData);

        // 3. Add column widths for better readability
        const wscols = [
            { wch: 15 }, // Date
            { wch: 20 }, // Category
            { wch: 30 }, // Note
            { wch: 10 }, // Type
            { wch: 15 }, // Amount
        ];
        worksheet['!cols'] = wscols;

        // 4. Append worksheet to workbook
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        // 5. Generate and download the file
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
        
        return true;
    } catch (error) {
        console.error("Excel Export Error:", error);
        return false;
    }
};

/**
 * Exports data to a CSV file
 * @param {Array} data - Array of objects to export
 * @param {string} fileName - Name of the file
 */
export const exportToCSV = (data, fileName = "FinTrack_Data") => {
    try {
        if (!data || data.length === 0) return;

        const headers = ["Date", "Category", "Note", "Type", "Amount"];
        const rows = data.map(item => [
            new Date(item.date).toLocaleDateString(),
            item.category || "Other",
            `"${item.note || '-'}"`,
            item.type || "Expense",
            item.amount
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${fileName}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
    } catch (error) {
        console.error("CSV Export Error:", error);
        return false;
    }
};
