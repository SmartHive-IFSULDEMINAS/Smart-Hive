import { Opacity as PropolisIcon } from '@mui/icons-material';
import ColetaProdutoPage from '../components/ColetaProdutoPage';

export default function ProducaoPropolis() {
    return <ColetaProdutoPage tipoProduto="propolis" titulo="Produção de Própolis" icone={<PropolisIcon />} />;
}
