import { Eye } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, EntityTable, FilterBar, SectionHeader } from '@/shared/ui';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  receivedAt: string;
  isRead: boolean;
}

export default function MessagesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const messages: ContactMessage[] = [];

  const columns = [
    {
      id: 'name',
      header: 'Nombre',
      accessor: (item: ContactMessage) => (
        <span className={item.isRead ? 'text-foreground' : 'font-semibold text-foreground'}>
          {item.name}
        </span>
      ),
    },
    {
      id: 'email',
      header: 'Email',
      accessor: (item: ContactMessage) => item.email,
    },
    {
      id: 'subject',
      header: 'Asunto',
      accessor: (item: ContactMessage) => item.subject,
    },
    {
      id: 'received',
      header: 'Fecha de recepción',
      accessor: (item: ContactMessage) => item.receivedAt,
    },
    {
      id: 'actions',
      header: 'Acciones',
      accessor: () => (
        <Button size="sm" variant="outline">
          <Eye data-icon="inline-start" />
          Ver mensaje
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <SectionHeader
        title="Mensajes"
        description="Mensajes de contacto recibidos desde bopacorp-web"
      />

      <FilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar mensajes..."
        filters={[
          {
            id: 'read',
            placeholder: 'Estado de lectura',
            options: [
              { value: 'all', label: 'Todos' },
              { value: 'unread', label: 'No leídos' },
              { value: 'read', label: 'Leídos' },
            ],
          },
        ]}
      />

      {messages.length === 0 ? (
        <EmptyState
          title="No hay mensajes"
          description="Los mensajes de contacto del sitio web aparecerán aquí"
        />
      ) : (
        <EntityTable data={messages} columns={columns} keyExtractor={(item) => item.id} />
      )}
    </div>
  );
}
