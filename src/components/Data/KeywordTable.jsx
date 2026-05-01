import React, { useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor("word", {
    header: "Keyword",
    cell: (info) => <span className="table-word">{info.getValue()}</span>,
  }),
  columnHelper.accessor("count", {
    header: "Frequency",
    cell: (info) => <span className="table-count">{info.getValue()}</span>,
  }),
];

// Custom Filter Function for Comma Separated Values
const commaSeparatedFilter = (row, columnId, filterValue) => {
  if (!filterValue) return true;

  // Split input by commas, trim whitespace, and convert to lowercase
  const searchTerms = filterValue
    .split(",")
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term !== "");

  // Get the value of the cell being filtered
  const cellValue = String(row.getValue(columnId)).toLowerCase();

  // Return true if the cell matches ANY of the search terms
  return searchTerms.some((term) => cellValue.includes(term));
};

const KeywordTable = ({ keywordData, minCount, maxCount }) => {
  const [globalFilter, setGlobalFilter] = useState("");

  const filteredData = useMemo(() => {
    return keywordData.filter(
      (item) => item.count >= minCount && item.count <= maxCount
    );
  }, [keywordData, minCount, maxCount]);

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: commaSeparatedFilter, // Apply the custom filter here
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="table-wrapper">
      <div className="table-header-actions">
        <input
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="table-search-input"
          placeholder="Search multiple (e.g. mumbai, train, road)"
        />
      </div>

      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  style={{ cursor: "pointer" }}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {{
                    asc: " ASC",
                    desc: " DESC",
                  }[header.column.getIsSorted()] ?? null}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default KeywordTable;