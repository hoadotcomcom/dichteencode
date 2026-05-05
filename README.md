# TeenCode

Website dịch ngôn ngữ GenZ/slang Việt Nam sang tiếng Việt chuẩn, giúp phụ huynh hiểu con cái đang nói gì.

## 🚀 Quick Start

### 1. Clone và setup
```bash
git clone <repo-url>
cd teencode
cp .env.example .env
# Chỉnh sửa .env với thông tin LLM proxy của bạn
```

### 2. Start database
```bash
docker compose up -d
```

### 3. Start backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Start frontend
```bash
cd frontend
npm install
npm run dev
```

### 5. Truy cập
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- pgAdmin: http://localhost:5050 (chỉ khi dùng `--profile dev`)

## 📁 Project Structure

```
teencode/
├── docker-compose.yml
├── .env.example
├── INTEGRATION.md          # LLM Proxy docs
├── backend/                # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── api/
│   │   └── services/
│   ├── init.sql
│   └── requirements.txt
└── frontend/               # Vite + React
    ├── src/
    │   ├── App.jsx
    │   ├── components/
    │   ├── pages/
    │   └── lib/
    └── package.json
```

## 🔧 Tech Stack

- **Backend**: Python 3.11+, FastAPI, SQLAlchemy
- **Frontend**: Vite, React 18, Tailwind CSS
- **Database**: PostgreSQL 16 (Docker)
- **LLM**: OpenAI SDK → Proxy (hỗ trợ Claude, GPT, Gemini)

## 🛡️ Security Features

- Prompt injection protection
- Input validation & sanitization
- Rate limiting per IP
- JWT authentication cho admin
- Encrypted sensitive settings

## 📝 API Endpoints

### Public
- `POST /api/translate` - Dịch slang
- `GET /api/health` - Health check

### Admin (requires JWT)
- `POST /api/admin/login` - Login
- `GET /api/admin/settings` - Lấy settings
- `PUT /api/admin/settings` - Cập nhật settings
- `GET /api/admin/logs` - Xem translation logs

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📦 Deployment

### Backend (Railway/Fly.io)
```bash
cd backend
# Thêm Dockerfile nếu cần
```

### Frontend (Vercel)
```bash
cd frontend
vercel deploy
```

## 🔐 Security Notes

1. **ĐỔI NGAY** default admin password sau khi deploy
2. Không commit file `.env` vào git
3. Dùng HTTPS trong production
4. Enable rate limiting nghiêm ngặt hơn trong production

## 📖 Ví dụ Slang

| Input | Output |
|-------|--------|
| tml ntn r | Thằng mặt lồn như thế nào rồi |
| đb vcl | Đầu buồi, vãi cả lồn |
| sml | Sấp mặt lồn |
| j z tr | Gì vậy trời |
| đc r | Được rồi |

## 📄 License

MIT
