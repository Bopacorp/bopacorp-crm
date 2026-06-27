import { useNavigate } from 'react-router-dom';
import { CatalogItemCreateSheet } from '../components/CatalogItemCreateSheet.js';

export default function CatalogItemCreatePage() {
  const navigate = useNavigate();

  return (
    <CatalogItemCreateSheet
      open
      onOpenChange={(open) => {
        if (!open) navigate('/catalogo');
      }}
      onCreated={(id) => navigate(`/catalogo/${id}`)}
    />
  );
}
