import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    Alert,
    Link,
    Container,
    MenuItem,
    useTheme,
    alpha,
} from '@mui/material';
import { Hive as HiveIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        passwordConfirm: '',
        first_name: '',
        last_name: '',
        telefone: '',
        role: 'apicultor',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.passwordConfirm) {
            setError('As senhas não coincidem');
            return;
        }

        if (formData.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);

        const { passwordConfirm, ...registerData } = formData;
        const result = await register(registerData);
        
        if (result.success) {
            navigate('/');
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.palette.background.default,
                p: 2,
            }}
        >
            <Container maxWidth="sm">
                <Card
                    sx={{
                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                        borderRadius: 3,
                    }}
                >
                    <CardContent sx={{ p: 4 }}>
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 80,
                                    height: 80,
                                    borderRadius: '50%',
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    mb: 2,
                                }}
                            >
                                <HiveIcon sx={{ fontSize: 50, color: theme.palette.primary.main }} />
                            </Box>
                            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                                Criar Conta
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Registre-se no Smart-Hive
                            </Typography>
                        </Box>

                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        <Box component="form" onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Usuário"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                margin="normal"
                                required
                                autoFocus
                            />
                            <TextField
                                fullWidth
                                label="E-mail"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                margin="normal"
                                required
                            />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    fullWidth
                                    label="Nome"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    margin="normal"
                                />
                                <TextField
                                    fullWidth
                                    label="Sobrenome"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    margin="normal"
                                />
                            </Box>
                            <TextField
                                fullWidth
                                label="Telefone"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleChange}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                select
                                label="Função"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                margin="normal"
                            >
                                <MenuItem value="apicultor">Apicultor</MenuItem>
                                <MenuItem value="gestor">Gestor</MenuItem>
                                <MenuItem value="dono">Dono/Proprietário</MenuItem>
                            </TextField>
                            <TextField
                                fullWidth
                                label="Senha"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                margin="normal"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Confirmar Senha"
                                name="passwordConfirm"
                                type="password"
                                value={formData.passwordConfirm}
                                onChange={handleChange}
                                margin="normal"
                                required
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                sx={{ mt: 3, mb: 2, py: 1.5 }}
                                disabled={loading}
                            >
                                {loading ? 'Registrando...' : 'Registrar'}
                            </Button>
                        </Box>

                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Já tem uma conta?{' '}
                                <Link
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate('/login');
                                    }}
                                    sx={{ fontWeight: 600 }}
                                >
                                    Entrar
                                </Link>
                            </Typography>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

