import React, { useMemo } from 'react';
import { 
  useReactTable, 
  getCoreRowModel, 
  getPaginationRowModel, 
  getFilteredRowModel, 
  flexRender,
  createColumnHelper 
} from '@tanstack/react-table';

const columnHelper = createColumnHelper();

const columns = [
  columnHelper.accessor('title', {
    header: 'Title',
    cell: info => <div className="post-title-cell" style={{ fontWeight: '600' }}>{info.getValue()}</div>,
  }),
  columnHelper.accessor('sentiment', {
    header: 'Mood',
    cell: info => (
      <span className={`sentiment-tag ${info.getValue().toLowerCase()}`}>
        {info.getValue()}
      </span>
    ),
  }),
  columnHelper.accessor('body', {
    header: 'Preview',
    cell: info => <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{info.getValue()}...</div>,
  }),
];

const PostsTable = ({ posts, selectedSentiment }) => {
  const filteredData = useMemo(() => {
    return selectedSentiment ? posts.filter(p => p.sentiment === selectedSentiment) : posts;
  }, [posts, selectedSentiment]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (posts.length === 0) return <p className="empty-state">No posts loaded.</p>;

  return (
    <div className="table-section">
      <h3>{selectedSentiment ? `${selectedSentiment} Posts` : 'All Posts'}</h3>
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id}>
              {hg.headers.map(header => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="pagination" style={{ display: 'flex', gap: '10px', marginTop: '15px', alignItems: 'center' }}>
        <button className="step-btn" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Prev</button>
        <span style={{ color: '#fff' }}>Page {table.getState().pagination.pageIndex + 1}</span>
        <button className="step-btn" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</button>
      </div>
    </div>
  );
};

export default PostsTable;