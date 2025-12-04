// src/app/api/clients/[id]/product-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Força a rota a ser dinâmica (não fazer prerender durante build)
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const clientId = resolvedParams.id;

    // Buscar as últimas visitas com produtos solicitados
    const visitsRef = collection(db, 'clients', clientId, 'visits');
    const visitsQuery = query(
      visitsRef,
      where('productsRequested', '!=', []),
      orderBy('date', 'desc'),
      limit(5)
    );

    const visitsSnapshot = await getDocs(visitsQuery);
    const allProducts = new Set<string>();

    // Coletar todos os produtos únicos solicitados
    visitsSnapshot.forEach((doc) => {
      const visit = doc.data();
      if (visit.productsRequested && Array.isArray(visit.productsRequested)) {
        visit.productsRequested.forEach((product: { productName?: string }) => {
          if (product.productName) {
            allProducts.add(product.productName);
          }
        });
      }
    });

    return NextResponse.json({
      products: Array.from(allProducts),
      clientId
    });

  } catch (error) {
    console.error('Erro ao buscar produtos solicitados:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}