import tkinter as tk
from tkinter import ttk, filedialog, messagebox
import pandas as pd
import os
from pathlib import Path
import threading

# Modern color scheme
COLORS = {
    'primary': '#007AFF',      # iOS Blue
    'secondary': '#5856D6',    # Purple
    'success': '#34C759',      # Green
    'background': '#F2F2F7',   # Light gray
    'surface': '#FFFFFF',      # White
    'text': '#000000',         # Black
    'text_light': '#8E8E93',   # Light gray
    'accent': '#FF3B30',       # Red
    'border': '#C6C6C8'        # Border gray
}

class ExcelEditorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Hoco Parts Excel Editor")
        self.root.geometry("900x700")
        self.root.configure(bg=COLORS['background'])
        
        # Configure style
        self.setup_styles()
        
        # Variables
        self.selected_files = []
        self.output_directory = ""
        
        self.setup_ui()
        
    def setup_styles(self):
        """Configure modern, clean styles"""
        style = ttk.Style()
        
        # Configure modern styles
        style.configure('Title.TLabel', 
                       font=('SF Pro Display', 24, 'normal'),
                       foreground=COLORS['text'],
                       background=COLORS['background'])
        
        style.configure('Subtitle.TLabel', 
                       font=('SF Pro Text', 14, 'normal'),
                       foreground=COLORS['text_light'],
                       background=COLORS['background'])
        
        style.configure('Section.TLabel', 
                       font=('SF Pro Text', 16, 'bold'),
                       foreground=COLORS['text'],
                       background=COLORS['background'])
        
        style.configure('Body.TLabel', 
                       font=('SF Pro Text', 13, 'normal'),
                       foreground=COLORS['text_light'],
                       background=COLORS['background'])
        
        style.configure('Primary.TButton',
                       font=('SF Pro Text', 14, 'bold'),
                       padding=(20, 12))
        
        style.configure('Secondary.TButton',
                       font=('SF Pro Text', 13, 'normal'),
                       padding=(16, 8))
        
        # Clean frame styles
        style.configure('Card.TFrame',
                       background=COLORS['surface'],
                       relief='flat',
                       borderwidth=0)
        
        style.configure('TLabelFrame',
                       background=COLORS['surface'],
                       relief='flat',
                       borderwidth=1,
                       bordercolor=COLORS['border'])
        
        style.configure('TLabelFrame.Label',
                       background=COLORS['surface'],
                       foreground=COLORS['text'],
                       font=('SF Pro Text', 14, 'bold'))
        
    def setup_ui(self):
        # Main container with padding
        main_container = ttk.Frame(self.root, padding="20")
        main_container.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Header section
        header_frame = ttk.Frame(main_container, style='Card.TFrame')
        header_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 20))
        
        # Title with icon
        title_frame = ttk.Frame(header_frame)
        title_frame.grid(row=0, column=0, sticky=(tk.W, tk.E), padx=20, pady=15)
        
        title_label = ttk.Label(title_frame, text="📊 Hoco Parts Excel Editor", 
                               style='Title.TLabel')
        title_label.grid(row=0, column=0, pady=(0, 5))
        
        subtitle_label = ttk.Label(title_frame, 
                                  text="Transform your Excel files with automated processing",
                                  style='Info.TLabel')
        subtitle_label.grid(row=1, column=0)
        
        # File selection section
        file_frame = ttk.LabelFrame(main_container, text="📁 Select Excel Files", 
                                   padding="20")
        file_frame.grid(row=1, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 15))
        
        # File list with custom styling
        listbox_frame = ttk.Frame(file_frame)
        listbox_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 15))
        
        self.file_listbox = tk.Listbox(listbox_frame, height=6, selectmode=tk.EXTENDED,
                                      font=('Segoe UI', 10),
                                      bg=COLORS['surface'],
                                      fg=COLORS['text'],
                                      selectbackground=COLORS['primary'],
                                      selectforeground='white',
                                      relief='flat',
                                      borderwidth=1)
        self.file_listbox.grid(row=0, column=0, sticky=(tk.W, tk.E))
        
        # Scrollbar for file list
        scrollbar = ttk.Scrollbar(listbox_frame, orient=tk.VERTICAL, command=self.file_listbox.yview)
        scrollbar.grid(row=0, column=1, sticky=(tk.N, tk.S))
        self.file_listbox.config(yscrollcommand=scrollbar.set)
        
        # File buttons with better styling
        button_frame = ttk.Frame(file_frame)
        button_frame.grid(row=1, column=0, columnspan=2)
        
        add_button = ttk.Button(button_frame, text="➕ Add Files", 
                               style='Primary.TButton',
                               command=self.add_files)
        add_button.grid(row=0, column=0, padx=(0, 10))
        
        remove_button = ttk.Button(button_frame, text="🗑️ Remove Selected", 
                                  style='Secondary.TButton',
                                  command=self.remove_files)
        remove_button.grid(row=0, column=1)
        
        # Output directory section
        output_frame = ttk.LabelFrame(main_container, text="📂 Output Directory", 
                                     padding="20")
        output_frame.grid(row=2, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 15))
        
        output_content_frame = ttk.Frame(output_frame)
        output_content_frame.grid(row=0, column=0, sticky=(tk.W, tk.E))
        
        self.output_label = ttk.Label(output_content_frame, 
                                     text="No output directory selected",
                                     style='Info.TLabel',
                                     wraplength=400)
        self.output_label.grid(row=0, column=0, sticky=(tk.W, tk.E), padx=(0, 15))
        
        output_button = ttk.Button(output_content_frame, text="📁 Select Directory", 
                                  style='Primary.TButton',
                                  command=self.select_output_directory)
        output_button.grid(row=0, column=1)
        
        # Processing section
        process_frame = ttk.LabelFrame(main_container, text="⚙️ Processing", 
                                      padding="20")
        process_frame.grid(row=3, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 15))
        
        # Progress section
        progress_frame = ttk.Frame(process_frame)
        progress_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E), pady=(0, 15))
        
        # Progress bar with custom styling
        self.progress = ttk.Progressbar(progress_frame, mode='determinate',
                                       length=400, style='TProgressbar')
        self.progress.grid(row=0, column=0, sticky=(tk.W, tk.E))
        
        # Status label
        self.status_label = ttk.Label(progress_frame, text="✅ Ready to process files",
                                     style='Header.TLabel')
        self.status_label.grid(row=1, column=0, pady=(10, 0))
        
        # Process button
        self.process_button = ttk.Button(process_frame, text="🚀 Process Files", 
                                        style='Primary.TButton',
                                        command=self.process_files)
        self.process_button.grid(row=1, column=0, columnspan=2)
        
        # Instructions section
        instructions_frame = ttk.LabelFrame(main_container, text="📋 Instructions", 
                                           padding="20")
        instructions_frame.grid(row=4, column=0, columnspan=2, sticky=(tk.W, tk.E))
        
        instructions = """• Click 'Add Files' to select .xlsx files to process
• Select output directory for processed files  
• Click 'Process Files' to apply transformations:
  🔹 Delete columns A & C
  🔹 Rename new column A to 'SKU'
  🔹 Rename new column B to 'Stock Level'
  🔹 Add new column 'Location' filled with 'Hoco Parts'
  🔹 Remove commas from stock level numbers
  🔹 Export as CSV format"""
        
        instruction_label = ttk.Label(instructions_frame, text=instructions, 
                                     style='Info.TLabel', justify=tk.LEFT)
        instruction_label.grid(row=0, column=0, sticky=(tk.W, tk.E))
        
        # Configure grid weights for responsive design
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_container.columnconfigure(0, weight=1)
        listbox_frame.columnconfigure(0, weight=1)
        output_content_frame.columnconfigure(0, weight=1)
        progress_frame.columnconfigure(0, weight=1)
        
    def add_files(self):
        files = filedialog.askopenfilenames(
            title="Select Excel files",
            filetypes=[("Excel files", "*.xlsx"), ("All files", "*.*")]
        )
        
        for file in files:
            if file not in self.selected_files:
                self.selected_files.append(file)
                self.file_listbox.insert(tk.END, os.path.basename(file))
                
    def remove_files(self):
        selected_indices = self.file_listbox.curselection()
        # Remove in reverse order to maintain indices
        for index in reversed(selected_indices):
            self.file_listbox.delete(index)
            del self.selected_files[index]
            
    def select_output_directory(self):
        directory = filedialog.askdirectory(title="Select Output Directory")
        if directory:
            self.output_directory = directory
            self.output_label.config(text=directory)
            
    def process_files(self):
        if not self.selected_files:
            messagebox.showwarning("No Files", "Please select at least one file to process.")
            return
            
        if not self.output_directory:
            messagebox.showwarning("No Output Directory", "Please select an output directory.")
            return
            
        # Disable process button and start processing in a separate thread
        self.process_button.config(state='disabled')
        self.progress.config(maximum=len(self.selected_files))
        
        # Start processing in a separate thread to avoid freezing the UI
        thread = threading.Thread(target=self.process_files_thread)
        thread.daemon = True
        thread.start()
        
    def process_files_thread(self):
        try:
            for i, file_path in enumerate(self.selected_files):
                self.root.after(0, lambda: self.status_label.config(text=f"Processing: {os.path.basename(file_path)}"))
                
                # Process the file
                self.process_single_file(file_path)
                
                # Update progress
                self.root.after(0, lambda: self.progress.config(value=i + 1))
                
            # Processing complete
            self.root.after(0, lambda: self.status_label.config(text="Processing complete!"))
            self.root.after(0, lambda: messagebox.showinfo("Success", 
                f"Successfully processed {len(self.selected_files)} file(s).\n"
                f"Output saved to: {self.output_directory}"))
                
        except Exception as e:
            self.root.after(0, lambda: messagebox.showerror("Error", f"Error processing files: {str(e)}"))
            self.root.after(0, lambda: self.status_label.config(text="Error occurred"))
            
        finally:
            self.root.after(0, lambda: self.process_button.config(state='normal'))
            
    def process_single_file(self, file_path):
        try:
            # Read the Excel file with proper header handling
            df = pd.read_excel(file_path, header=0)
            
            # Delete columns A & C (indices 0 & 2)
            if len(df.columns) > 2:
                df = df.drop(df.columns[[0, 2]], axis=1)
            elif len(df.columns) > 0:
                df = df.drop(df.columns[0], axis=1)
            
            # Create new column names list
            new_columns = []
            if len(df.columns) >= 1:
                new_columns.append('SKU')
            if len(df.columns) >= 2:
                new_columns.append('Stock Level')
            
            # Assign new column names
            df.columns = new_columns
                
            # Add Location column filled with 'Hoco Parts'
            df['Location'] = 'Hoco Parts'
            
            # Process Stock Level column to remove commas (only if column exists)
            if 'Stock Level' in df.columns and len(df) > 0:
                # Create a copy to avoid issues
                stock_levels = df['Stock Level'].copy()
                
                for idx in stock_levels.index:
                    try:
                        value = stock_levels.iloc[idx]
                        if pd.notna(value) and value != 'Stock Level':  # Skip header
                            # Convert to string and clean
                            clean_value = str(value).replace(',', '').replace(' ', '')
                            # Try to convert to numeric, if fails keep original
                            try:
                                numeric_value = float(clean_value)
                                stock_levels.iloc[idx] = numeric_value
                            except (ValueError, TypeError):
                                # Keep original value if conversion fails
                                stock_levels.iloc[idx] = value
                    except Exception:
                        # Skip this row if there's any error
                        continue
                
                df['Stock Level'] = stock_levels
            
            # Generate output filename
            input_filename = Path(file_path).stem
            output_filename = f"{input_filename}_processed.csv"
            output_path = os.path.join(self.output_directory, output_filename)
            
            # Save as CSV
            df.to_csv(output_path, index=False)
            
        except Exception as e:
            raise Exception(f"Error processing {os.path.basename(file_path)}: {str(e)}")

def main():
    root = tk.Tk()
    app = ExcelEditorApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
