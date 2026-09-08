import { Grain as PolenIcon } from '@mui/icons-material';
import ColetaProdutoPage from '../components/ColetaProdutoPage';

export default function ProducaoPolen() {
    return <ColetaProdutoPage tipoProduto="polen" titulo="Produção de Pólen" icone={<PolenIcon />} />;
}
