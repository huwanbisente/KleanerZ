from fpdf import FPDF
import os

class pdf_report(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, 'Project KleanerZ - System Architecture & Guide', 0, 1, 'C')
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('Arial', 'B', 14)
        self.set_fill_color(200, 220, 255)
        self.cell(0, 10, title, 0, 1, 'L', 1)
        self.ln(4)

    def chapter_body(self, body):
        self.set_font('Arial', '', 12)
        self.multi_cell(0, 7, body)
        self.ln()

    def draw_box(self, x, y, w, h, text, color=(255, 255, 255)):
        self.set_fill_color(*color)
        self.rect(x, y, w, h, 'DF')
        self.set_xy(x, y + h/2 - 3)
        self.set_font('Arial', 'B', 10)
        self.cell(w, 6, text, 0, 0, 'C')

    def draw_arrow(self, x1, y1, x2, y2):
        self.line(x1, y1, x2, y2)
        # Simple arrowhead
        self.circle(x2, y2, 1)

pdf = pdf_report()
pdf.add_page()

# --- Section 1: Tech Stack ---
pdf.chapter_title('1. Technology Stack')
stack_info = (
    "Core Frameworks:\n"
    " - Frontend: Next.js 16.1 (React 19) - Modern Server-Side Rendering & UI.\n"
    " - Backend: FastAPI (Python 3.x) - High performance async API.\n"
    " - Database: SQLite (with SQLAlchemy ORM) - Lightweight & relational.\n\n"
    "Key Libraries:\n"
    " - Styling: CSS Modules / Tailwind (if configured)\n"
    " - Auth: JWT with python-jose & passlib\n"
    " - Validation: Pydantic\n"
    " - Visualization: Chart.js, Leaflet (React adapters)"
)
pdf.chapter_body(stack_info)

# --- Section 2: Flowchart ---
pdf.chapter_title('2. System Flowchart')
pdf.ln(5)

# Coordinates
start_y = pdf.get_y()
# Frontend
pdf.draw_box(20, start_y, 50, 25, "Frontend Client\n(Browser / Next.js)", (230, 240, 255))
# Backend
pdf.draw_box(90, start_y, 50, 25, "Backend API\n(FastAPI)", (255, 240, 230))
# Database
pdf.draw_box(160, start_y, 30, 25, "Database\n(SQLite)", (230, 255, 230))

# Connections
# Front to Back
pdf.line(70, start_y + 12.5, 90, start_y + 12.5) # Line
# Arrowhead right (manual lines)
pdf.line(90, start_y + 12.5, 88, start_y + 10)
pdf.line(90, start_y + 12.5, 88, start_y + 15)
pdf.line(88, start_y + 10, 88, start_y + 15)

# Back to DB
pdf.line(140, start_y + 12.5, 160, start_y + 12.5)
# Arrowhead right
pdf.line(160, start_y + 12.5, 158, start_y + 10)
pdf.line(160, start_y + 12.5, 158, start_y + 15)
pdf.line(158, start_y + 10, 158, start_y + 15)

# Sub-components lists
pdf.set_xy(20, start_y + 30)
pdf.set_font('Arial', '', 9)
pdf.multi_cell(50, 5, "- Pages (Home, Dashboard)\n- Context (Auth, UI)\n- Components (Forms, Cards)")

pdf.set_xy(90, start_y + 30)
pdf.multi_cell(50, 5, "Routers:\n- Auth (Login/Register)\n- Users (Profiles)\n- Quests (Jobs/CUD)\n- Messages (Chat)\n- Reviews (Ratings)")

pdf.set_xy(160, start_y + 30)
pdf.multi_cell(30, 5, "- Users Table\n- Quests Table\n- Messages\n- Reviews")

pdf.ln(30)

# --- Section 3: How to Run ---
pdf.chapter_title('3. Execution Guide')
guide_text = (
    "Prerequisites: Node.js, Python 3.9+\n\n"
    "Step 1: Start the Backend\n"
    "1. Open Terminal 1.\n"
    "2. Navigate to 'backend' directory: `cd backend`\n"
    "3. Activate Virtual Env: `backend\\.venv\\Scripts\\activate` (Windows)\n"
    "4. Run Server: `uvicorn main:app --reload`\n"
    "   *Output: Running on http://127.0.0.1:8000*\n\n"
    "Step 2: Start the Frontend\n"
    "1. Open Terminal 2.\n"
    "2. Navigate to 'frontend' directory: `cd frontend`\n"
    "3. Install dependencies (if new): `npm install`\n"
    "4. Start Dev Server: `npm run dev`\n"
    "   *Output: Ready on http://localhost:3000*\n\n"
    "Step 3: Access Application\n"
    " - Open browser to http://localhost:3000"
)
pdf.chapter_body(guide_text)

# --- Save ---
output_path = os.path.join(os.path.dirname(__file__), '..', '..', 'System_Architecture_Guide.pdf')
pdf.output(output_path)
print(f"PDF generated successfully at: {output_path}")
