import * as React from "react";

type TableElement = HTMLTableElement;
type TableHeaderElement = HTMLTableSectionElement;
type TableBodyElement = HTMLTableSectionElement;
type TableFooterElement = HTMLTableSectionElement;
type TableRowElement = HTMLTableRowElement;
type TableHeadElement = HTMLTableCellElement;
type TableCellElement = HTMLTableCellElement;

export const Table = React.forwardRef<TableElement, React.HTMLAttributes<TableElement>>(
  ({ className, ...props }, ref) => (
    <table
      ref={ref}
      className={[
        "w-full text-sm text-left align-middle",
        "border-collapse border-spacing-0",
        "text-foreground",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  ),
);
Table.displayName = "Table";

export const TableHeader = React.forwardRef<
  TableHeaderElement,
  React.HTMLAttributes<TableHeaderElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={["bg-muted", className ?? ""].filter(Boolean).join(" ")}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef<TableBodyElement, React.HTMLAttributes<TableBodyElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={className}
      {...props}
    />
  ),
);
TableBody.displayName = "TableBody";

export const TableFooter = React.forwardRef<
  TableFooterElement,
  React.HTMLAttributes<TableFooterElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={["bg-muted", className ?? ""].filter(Boolean).join(" ")}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

export const TableRow = React.forwardRef<TableRowElement, React.HTMLAttributes<TableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={["border-b border-border", className ?? ""].filter(Boolean).join(" ")}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef<TableHeadElement, React.ThHTMLAttributes<TableHeadElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={[
        "h-10 px-4 text-left text-xs font-medium text-muted-foreground uppercase",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef<TableCellElement, React.TdHTMLAttributes<TableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={["p-4 align-top", className ?? ""].filter(Boolean).join(" ")}
      {...props}
    />
  ),
);
TableCell.displayName = "TableCell";

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={["mt-4 text-sm text-muted-foreground", className ?? ""].filter(Boolean).join(" ")}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";
