# 🚀 Quick Start Guide - TeenCode

## Bước 1: Cài đặt môi trường

### Yêu cầu:
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- LLM Proxy đang chạy (xem INTEGRATION.md)

## Bước 2: Clone & Setup

```bash
cd teencode
./start.sh
```

Script sẽ tự động:
- Copy `.env.example` → `.env`
- Start PostgreSQL qua Docker
- Tạo Python venv
- Install dependencies

## Bước 3: Cấu hình LLM Proxy

Chỉnh sửa `.env`:

```bash
LLM_BASE_URL=http://your-proxy-host:9000
LLM_API_KEY=your-api-key-here
LLM_MODEL=claude-sonnet-4.6
```

## Bước 4: Start Services

### Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

### Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

## Bước 5: Truy cập

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **pgAdmin**: http://localhost:5050 (nếu dùng `--profile dev`)

## Bước 6: Login Admin

1. Vào http://localhost:5173/admin/login
2. Login với:
   - Username: `admin`
   - Password: `admin123`
3. **ĐỔI PASSWORD NGAY!**

## Bước 7: Cấu hình Settings

Trong Admin Panel → Settings:
- `llm_base_url`: URL proxy của bạn
- `llm_api_key`: API key từ proxy
- `llm_model`: Model muốn dùng (claude-sonnet-4.6, gpt-5-mini...)
- `translation_prompt`: Có thể chỉnh sửa nếu cần

## Test Translation

1. Vào trang chủ: http://localhost:5173
2. Nhập: `tml ntn r`
3. Click "Dịch ngay"
4. Kết quả: `Thằng mặt lồn như thế nào rồi`

## Troubleshooting

### Database không start
```bash
docker compose down -v
docker compose up -d
```

### Backend lỗi "LLM chưa được cấu hình"
→ Kiểm tra `llm_api_key` trong Admin Settings

### Frontend không connect được backend
→ Kiểm tra CORS trong `.env`: `CORS_ORIGINS=http://localhost:5173`

### Rate limit quá thấp
→ Tăng `RATE_LIMIT_PER_MINUTE` trong `.env`

## Development Tips

### Xem logs backend:
```bash
# Backend tự động log ra console
```

### Xem database:
```bash
docker compose --profile dev up -d  # Start pgAdmin
# Truy cập: http://localhost:5050
# Login: admin@teencode.local / admin
```

### Reset database:
```bash
docker compose down -v
docker compose up -d
# Database sẽ được init lại từ init.sql
```

## Production Deployment

### Backend (Railway/Fly.io):
1. Set environment variables từ `.env`
2. Deploy với `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel):
1. Set `VITE_API_URL` = backend URL
2. Deploy: `vercel deploy`

### Database:
- Dùng managed PostgreSQL (Railway, Supabase, Neon...)
- Update `DATABASE_URL` trong backend env

## Security Checklist

- [ ] Đổi admin password
- [ ] Set JWT_SECRET mạnh
- [ ] Enable HTTPS trong production
- [ ] Giới hạn CORS_ORIGINS
- [ ] Tăng rate limiting nếu cần
- [ ] Không commit `.env` vào git

---

**Need help?** Check:
- README.md - Full documentation
- INTEGRATION.md - LLM Proxy setup
- backend/app/main.py - API endpoints
