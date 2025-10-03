import os
import sys
import pandas as pd
import tkinter as tk
from tkinter import ttk, filedialog, messagebox

import customtkinter as ctk


class ProcessOrdersApp(ctk.CTk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Process Orders - Linnworks vs Shopify")
        self.geometry("1100x700")
        ctk.set_appearance_mode("System")
        ctk.set_default_color_theme("blue")

        # State
        self.linnworks_df: pd.DataFrame | None = None
        self.shopify_df: pd.DataFrame | None = None
        self.output_df: pd.DataFrame | None = None

        self.linnworks_column = tk.StringVar(value="")
        self.shopify_column = tk.StringVar(value="")
        self.status_var = tk.StringVar(value="Ready")
        self.case_insensitive = tk.BooleanVar(value=True)
        self.normalize_spaces = tk.BooleanVar(value=True)

        # Layout
        self._build_ui()

    def _build_ui(self) -> None:
        # Top controls
        controls_frame = ctk.CTkFrame(self)
        controls_frame.pack(fill="x", padx=12, pady=12)

        upload_linn_btn = ctk.CTkButton(
            controls_frame,
            text="Upload Linnworks CSV",
            command=lambda: self.load_csv("linnworks"),
        )
        upload_linn_btn.grid(row=0, column=0, padx=6, pady=6)

        upload_shopify_btn = ctk.CTkButton(
            controls_frame,
            text="Upload Shopify CSV",
            command=lambda: self.load_csv("shopify"),
        )
        upload_shopify_btn.grid(row=0, column=1, padx=6, pady=6)

        # File name labels
        self.linn_file_label = ctk.CTkLabel(controls_frame, text="Linnworks: (no file)")
        self.linn_file_label.grid(row=1, column=0, padx=6, pady=(0, 6), sticky="w")
        self.shop_file_label = ctk.CTkLabel(controls_frame, text="Shopify: (no file)")
        self.shop_file_label.grid(row=1, column=1, padx=6, pady=(0, 6), sticky="w")

        # Column selection
        columns_frame = ctk.CTkFrame(self)
        columns_frame.pack(fill="x", padx=12, pady=6)

        ctk.CTkLabel(columns_frame, text="Linnworks Match Column:").grid(
            row=0, column=0, padx=6, pady=6, sticky="w"
        )
        self.linnworks_column_menu = ctk.CTkOptionMenu(
            columns_frame, values=[""], variable=self.linnworks_column
        )
        self.linnworks_column_menu.grid(row=0, column=1, padx=6, pady=6, sticky="w")
        self.linnworks_column_menu.configure(state="disabled")

        ctk.CTkLabel(columns_frame, text="Shopify Match Column:").grid(
            row=0, column=2, padx=12, pady=6, sticky="w"
        )
        self.shopify_column_menu = ctk.CTkOptionMenu(
            columns_frame, values=[""], variable=self.shopify_column
        )
        self.shopify_column_menu.grid(row=0, column=3, padx=6, pady=6, sticky="w")
        self.shopify_column_menu.configure(state="disabled")

        select_cols_btn = ctk.CTkButton(
            columns_frame, text="Select Matching Column", command=self._validate_columns
        )
        select_cols_btn.grid(row=0, column=4, padx=12, pady=6)

        # Process and export
        actions_frame = ctk.CTkFrame(self)
        actions_frame.pack(fill="x", padx=12, pady=6)

        # Match options
        opts_frame = ctk.CTkFrame(actions_frame)
        opts_frame.grid(row=0, column=0, padx=(6, 24), pady=6, sticky="w")
        ctk.CTkCheckBox(
            opts_frame, text="Case-insensitive", variable=self.case_insensitive
        ).grid(row=0, column=0, padx=(6, 12), pady=6, sticky="w")
        ctk.CTkCheckBox(
            opts_frame, text="Normalize spaces", variable=self.normalize_spaces
        ).grid(row=0, column=1, padx=(0, 6), pady=6, sticky="w")

        self.process_btn = ctk.CTkButton(
            actions_frame, text="Process", command=self.process_orders, state="disabled"
        )
        self.process_btn.grid(row=0, column=1, padx=6, pady=6)

        self.export_btn = ctk.CTkButton(
            actions_frame, text="Export CSV", command=self.save_output, state="disabled"
        )
        self.export_btn.grid(row=0, column=2, padx=6, pady=6)

        self.clear_btn = ctk.CTkButton(
            actions_frame, text="Clear", command=self.clear_state
        )
        self.clear_btn.grid(row=0, column=3, padx=6, pady=6)

        # Previews
        previews_frame = ctk.CTkFrame(self)
        previews_frame.pack(fill="both", expand=True, padx=12, pady=12)
        # Use grid for stable 3-column layout that doesn't shift when content changes
        try:
            previews_frame.grid_columnconfigure(0, weight=1, uniform="previews")
            previews_frame.grid_columnconfigure(1, weight=1, uniform="previews")
            previews_frame.grid_columnconfigure(2, weight=1, uniform="previews")
            previews_frame.grid_rowconfigure(0, weight=1)
        except Exception:
            pass

        left_frame = ctk.CTkFrame(previews_frame)
        left_frame.grid(row=0, column=0, padx=(0, 6), pady=0, sticky="nsew")
        middle_frame = ctk.CTkFrame(previews_frame)
        middle_frame.grid(row=0, column=1, padx=6, pady=0, sticky="nsew")
        right_frame = ctk.CTkFrame(previews_frame)
        right_frame.grid(row=0, column=2, padx=(6, 0), pady=0, sticky="nsew")

        ctk.CTkLabel(left_frame, text="Linnworks Preview (first 10 rows)").pack(
            anchor="w", padx=8, pady=(8, 4)
        )
        self.linn_tree = self._create_treeview(left_frame)

        ctk.CTkLabel(right_frame, text="Shopify Preview (first 10 rows)").pack(
            anchor="w", padx=8, pady=(8, 4)
        )
        self.shop_tree = self._create_treeview(right_frame)

        ctk.CTkLabel(middle_frame, text="Output Preview (first 10 rows)").pack(
            anchor="w", padx=8, pady=(8, 4)
        )
        self.output_tree = self._create_treeview(middle_frame)

        # Status bar
        status_frame = ctk.CTkFrame(self)
        status_frame.pack(fill="x", padx=12, pady=(0, 8))
        ctk.CTkLabel(status_frame, textvariable=self.status_var, anchor="w").pack(
            fill="x", padx=8, pady=4
        )

    def _create_treeview(self, parent: tk.Widget) -> ttk.Treeview:
        style = ttk.Style()
        # Ensure styles are set once; reuse silently if re-created
        style.configure("Treeview", rowheight=24)
        container = ctk.CTkFrame(parent)
        container.pack(fill="both", expand=True)

        columns = ("No data",)
        tree = ttk.Treeview(container, columns=columns, show="headings")
        tree.heading("No data", text="No data")
        vsb = ttk.Scrollbar(container, orient="vertical", command=tree.yview)
        hsb = ttk.Scrollbar(container, orient="horizontal", command=tree.xview)
        tree.configure(yscrollcommand=vsb.set, xscrollcommand=hsb.set)
        tree.grid(row=0, column=0, sticky="nsew")
        vsb.grid(row=0, column=1, sticky="ns")
        hsb.grid(row=1, column=0, sticky="ew")
        container.grid_rowconfigure(0, weight=1)
        container.grid_columnconfigure(0, weight=1)
        return tree

    def load_csv(self, kind: str) -> None:
        try:
            filepath = filedialog.askopenfilename(
                title=f"Select {kind.capitalize()} CSV",
                filetypes=[("CSV files", "*.csv"), ("All files", "*.*")],
            )
            if not filepath:
                self._set_status("File selection cancelled")
                return
            df = pd.read_csv(filepath, dtype=str, keep_default_na=False)

            if df.empty:
                messagebox.showwarning("Empty File", f"The selected {kind} CSV is empty.")
                self._set_status(f"{kind.capitalize()} CSV is empty")
                return

            if kind == "linnworks":
                self.linnworks_df = df
                self._update_preview(self.linn_tree, df)
                self._populate_columns(self.linnworks_column_menu, df, self.linnworks_column)
                self.linn_file_label.configure(text=f"Linnworks: {self._shorten_name(os.path.basename(filepath))}")
                self._set_status("Loaded Linnworks CSV")
            elif kind == "shopify":
                self.shopify_df = df
                self._update_preview(self.shop_tree, df)
                self._populate_columns(self.shopify_column_menu, df, self.shopify_column)
                self.shop_file_label.configure(text=f"Shopify: {self._shorten_name(os.path.basename(filepath))}")
                self._set_status("Loaded Shopify CSV")

            # Enable processing if we have both files and columns chosen
            self._update_process_button_state()
        except Exception as exc:
            messagebox.showerror("Error", f"Failed to load CSV: {exc}")
            self._set_status("Error loading CSV")

    def _update_preview(self, tree: ttk.Treeview, df: pd.DataFrame) -> None:
        # Clear existing
        for col in tree["columns"]:
            tree.heading(col, text="")
        tree.delete(*tree.get_children())

        preview_df = df.head(10)
        columns = list(preview_df.columns)
        tree.configure(columns=columns)
        for col in columns:
            tree.heading(col, text=col)
            tree.column(col, width=max(80, int(8 * 10)))

        for _, row in preview_df.iterrows():
            values = [str(row[col]) for col in columns]
            tree.insert("", "end", values=values)

    def _populate_columns(
        self, menu: ctk.CTkOptionMenu, df: pd.DataFrame, var: tk.StringVar
    ) -> None:
        cols = list(df.columns)
        if not cols:
            menu.configure(values=[""])
            menu.configure(state="disabled")
            var.set("")
            return
        menu.configure(values=cols)
        menu.configure(state="normal")
        # Autoselect a likely order number column if present
        preferred = self._guess_order_column(cols)
        var.set(preferred if preferred in cols else cols[0])

    def _guess_order_column(self, columns: list[str]) -> str:
        candidates = [
            "Order Number",
            "OrderNumber",
            "order_number",
            "Name",
            "name",
            "Order Id",
            "OrderID",
            "order_id",
            "Order",
            "Id",
            "ID",
        ]
        lower_map = {c.lower(): c for c in columns}
        for cand in candidates:
            if cand.lower() in lower_map:
                return lower_map[cand.lower()]
        return columns[0] if columns else ""

    def _validate_columns(self) -> None:
        if self.linnworks_df is None or self.shopify_df is None:
            messagebox.showwarning(
                "Missing Files", "Please upload both Linnworks and Shopify CSV files first."
            )
            return
        linn_col = self.linnworks_column.get().strip()
        shop_col = self.shopify_column.get().strip()
        if not linn_col or not shop_col:
            messagebox.showwarning(
                "Missing Columns", "Please select matching columns for both files."
            )
            return
        if linn_col not in self.linnworks_df.columns:
            messagebox.showerror("Invalid Column", f"Linnworks column '{linn_col}' not found.")
            return
        if shop_col not in self.shopify_df.columns:
            messagebox.showerror("Invalid Column", f"Shopify column '{shop_col}' not found.")
            return
        messagebox.showinfo("Columns Selected", "Matching columns are valid. You can Process now.")
        self._update_process_button_state()
        self._set_status("Columns validated")

    def _update_process_button_state(self) -> None:
        enabled = (
            self.linnworks_df is not None
            and self.shopify_df is not None
            and bool(self.linnworks_column.get())
            and bool(self.shopify_column.get())
        )
        self.process_btn.configure(state="normal" if enabled else "disabled")

    def process_orders(self) -> None:
        try:
            if self.linnworks_df is None or self.shopify_df is None:
                messagebox.showwarning(
                    "Missing Files", "Please upload both Linnworks and Shopify CSV files first."
                )
                return

            linn_col = self.linnworks_column.get().strip()
            shop_col = self.shopify_column.get().strip()
            if not linn_col or not shop_col:
                messagebox.showwarning(
                    "Missing Columns", "Please select matching columns for both files."
                )
                return

            if linn_col not in self.linnworks_df.columns:
                messagebox.showerror(
                    "Invalid Column", f"Linnworks column '{linn_col}' not found in file."
                )
                return
            if shop_col not in self.shopify_df.columns:
                messagebox.showerror(
                    "Invalid Column", f"Shopify column '{shop_col}' not found in file."
                )
                return

            # Normalize keys
            linn_keys = self._normalize_series(self.linnworks_df[linn_col])
            shop_keys = self._normalize_series(self.shopify_df[shop_col])

            shop_set = set(shop_keys.dropna().tolist())
            mask = ~linn_keys.isin(shop_set)
            result = self.linnworks_df.loc[mask].copy()

            if result.empty:
                messagebox.showinfo("No Orders", "No Linnworks orders eligible to process were found.")
                self.output_df = None
                self.export_btn.configure(state="disabled")
                self._set_status("No eligible orders found")
                return

            self.output_df = result
            self.export_btn.configure(state="normal")
            # Update output preview
            self._update_preview(self.output_tree, result)
            messagebox.showinfo(
                "Done",
                f"Found {len(result)} Linnworks orders not in Shopify unfulfilled list.",
            )
            self._set_status(f"Processed: {len(result)} orders ready to export")
        except Exception as exc:
            messagebox.showerror("Error", f"Failed to process orders: {exc}")
            self._set_status("Error during processing")

    def save_output(self) -> None:
        try:
            if self.output_df is None or self.output_df.empty:
                messagebox.showwarning("Nothing to Export", "Please process first; no results to export.")
                return

            filepath = filedialog.asksaveasfilename(
                title="Save Output CSV",
                defaultextension=".csv",
                initialfile="output.csv",
                filetypes=[("CSV files", "*.csv"), ("All files", "*.*")],
            )
            if not filepath:
                self._set_status("Export cancelled")
                return
            # Ensure parent directory exists
            os.makedirs(os.path.dirname(filepath) or ".", exist_ok=True)
            self.output_df.to_csv(filepath, index=False)
            messagebox.showinfo("Saved", f"Output saved to:\n{filepath}")
            self._set_status("Exported CSV successfully")
        except Exception as exc:
            messagebox.showerror("Error", f"Failed to save CSV: {exc}")
            self._set_status("Error saving CSV")

    def _set_status(self, text: str) -> None:
        self.status_var.set(text)

    def _normalize_series(self, series: pd.Series) -> pd.Series:
        s = series.astype(str).str.replace("\u200b", "", regex=False)
        if self.normalize_spaces.get():
            s = s.str.replace(r"\s+", " ", regex=True).str.strip()
        else:
            s = s.str.strip()
        if self.case_insensitive.get():
            s = s.str.lower()
        return s

    def clear_state(self) -> None:
        # Reset dataframes
        self.linnworks_df = None
        self.shopify_df = None
        self.output_df = None

        # Reset file labels
        self.linn_file_label.configure(text="Linnworks: (no file)")
        self.shop_file_label.configure(text="Shopify: (no file)")

        # Reset dropdowns
        self.linnworks_column.set("")
        self.shopify_column.set("")
        self.linnworks_column_menu.configure(values=[""])
        self.shopify_column_menu.configure(values=[""])
        self.linnworks_column_menu.configure(state="disabled")
        self.shopify_column_menu.configure(state="disabled")

        # Reset previews
        empty_df = pd.DataFrame({"No data": [""]})
        self._update_preview(self.linn_tree, empty_df)
        self._update_preview(self.shop_tree, empty_df)
        self._update_preview(self.output_tree, empty_df)

        # Reset buttons
        self.process_btn.configure(state="disabled")
        self.export_btn.configure(state="disabled")

        # Reset options
        self.case_insensitive.set(True)
        self.normalize_spaces.set(True)

        self._set_status("Cleared state")

    def _shorten_name(self, name: str, max_len: int = 50) -> str:
        if len(name) <= max_len:
            return name
        head = max_len // 2 - 2
        tail = max_len - head - 3
        return f"{name[:head]}...{name[-tail:]}"


def main() -> None:
    app = ProcessOrdersApp()
    app.mainloop()


if __name__ == "__main__":
    main()



