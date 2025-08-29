# Project Management System

A comprehensive project management system built with Next.js 15, TypeScript, Prisma, and PostgreSQL. This system is designed for municipal or organizational project management with features for program tracking, approvals, monitoring, payments, and reporting.

## 🚀 Features

### Core Functionality
- **Program Management**: Create, edit, and track programs with detailed information
- **Approval Workflow**: Multi-level approval system with status tracking
- **Document Management**: Upload and manage program-related documents
- **Payment Tracking**: Monitor payment requests and approvals
- **Monitoring & Reporting**: Track program progress and generate reports
- **Ward-based Organization**: Organize programs by administrative wards

### User Interface
- **Modern Design**: Clean, responsive UI built with Tailwind CSS
- **Interactive Dashboard**: Real-time statistics and quick actions
- **Dynamic Forms**: Smart forms with validation and error handling
- **Data Visualization**: Charts and graphs for better insights
- **Mobile Responsive**: Works seamlessly on all device sizes

### Technical Features
- **Type Safety**: Full TypeScript implementation
- **Database ORM**: Prisma for type-safe database operations
- **API Routes**: RESTful API with comprehensive endpoints
- **Authentication**: NextAuth.js with JWT tokens and role-based access
- **File Upload**: Secure file upload and management system
- **Real-time Updates**: Dynamic data fetching and updates
- **Error Handling**: Comprehensive error handling and validation
- **Notifications**: Real-time notification system

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Database**: PostgreSQL with Prisma ORM
- **Icons**: Lucide React
- **Validation**: Zod
- **Build Tool**: Turbopack (Next.js)

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js 18+ installed
- PostgreSQL database running
- npm or yarn package manager

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone <repository-url>
cd project-management-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/pms_db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database Setup
```bash
# Create the database
createdb pms_db

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed the database with sample data
npx tsx prisma/seed.ts
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (site)/            # Main application pages
│   │   ├── dashboard/     # Dashboard page
│   │   ├── programs/      # Program management
│   │   ├── approvals/     # Approval workflow
│   │   ├── reports/       # Reporting system
│   │   └── settings/      # System settings
│   └── api/               # API routes
│       ├── programs/      # Program CRUD operations
│       ├── approvals/     # Approval management
│       ├── reports/       # Report generation
│       └── dashboard/     # Dashboard data
├── components/            # Reusable UI components
│   ├── layout/           # Layout components
│   ├── ui/               # Basic UI components
│   ├── widgets/          # Dashboard widgets
│   └── kanban/           # Kanban board components
├── lib/                  # Utility libraries
└── prisma/               # Database schema and migrations
```

## 🗄️ Database Schema

The system uses a comprehensive database schema with the following main entities:

- **Programs**: Core program information
- **Wards**: Administrative divisions
- **FiscalYears**: Financial year management
- **ProgramTypes**: Program categorization
- **FundingSources**: Funding source tracking
- **Approvals**: Approval workflow management
- **Documents**: File management
- **Payments**: Payment tracking
- **MonitoringEntries**: Progress monitoring
- **ActivityLogs**: System activity tracking
- **Reports**: Generated reports
- **Notifications**: User notifications

## 🔧 API Endpoints

### Programs
- `GET /api/programs` - List programs with filtering
- `POST /api/programs` - Create new program
- `GET /api/programs/[id]` - Get program details
- `PUT /api/programs/[id]` - Update program
- `DELETE /api/programs/[id]` - Delete program

### Approvals
- `GET /api/approvals` - List approvals
- `POST /api/approvals` - Create approval request
- `PUT /api/approvals/[id]` - Update approval status

### Reports
- `GET /api/reports` - List generated reports
- `POST /api/reports` - Generate new report

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/ward-stats` - Get ward-specific stats

## 🎨 UI Components

The system includes a comprehensive set of reusable UI components:

- **Layout Components**: Shell, Navbar, Sidebar
- **Form Components**: Input, Select, Textarea, Button
- **Data Display**: Card, Table, Badge, Progress
- **Navigation**: Breadcrumbs, Pagination, Tabs
- **Feedback**: Toast notifications, Loading states
- **Widgets**: Dashboard widgets, Charts, Statistics

## 📊 Features in Detail

### Dashboard
- Real-time statistics and KPIs
- Quick action buttons
- Recent activity feed
- Ward-wise program distribution
- Budget utilization charts

### Program Management
- Comprehensive program creation form
- Document upload and management
- Status tracking and updates
- Budget and timeline management
- Tag-based categorization

### Approval Workflow
- Multi-level approval process
- Status-based filtering
- Bulk approval actions
- Comment and feedback system
- Email notifications (ready for integration)

### Reporting System
- Dynamic report generation
- Multiple report types (Ward, Status, Budget, Timeline)
- Export functionality
- Scheduled reports (framework ready)
- Custom report builder

### Monitoring & Tracking
- Progress tracking
- Milestone management
- Photo documentation
- Status updates
- Performance metrics

## 🔒 Security Features

- Input validation with Zod schemas
- SQL injection prevention with Prisma
- XSS protection
- CSRF protection (middleware ready)
- Authentication middleware setup
- Role-based access control (framework ready)

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Environment Variables for Production
Ensure all environment variables are properly set in your production environment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🔄 Updates and Maintenance

The system is built with modern technologies and follows best practices for maintainability:
- Regular dependency updates
- Code quality checks
- Performance monitoring
- Security updates
- Feature enhancements

---

Built with ❤️ using Next.js 15 and modern web technologies.