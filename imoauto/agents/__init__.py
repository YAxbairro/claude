"""
Subagentes do ImoAuto.

Cada um é um especialista com um único trabalho e um prompt próprio. O
orquestrador chama-os por nome; eles não se chamam uns aos outros.
"""

from imoauto.agents.aquisicao import Aquisicao
from imoauto.agents.copy import Copywriter
from imoauto.agents.design import Designer
from imoauto.agents.publicacao import Publicador
from imoauto.agents.seo import SEO
from imoauto.agents.vendas import Vendas
from imoauto.agents.vigia import Vigia

EQUIPA = {
    "aquisicao": Aquisicao,
    "copy": Copywriter,
    "seo": SEO,
    "design": Designer,
    "publicacao": Publicador,
    "vendas": Vendas,
    "vigia": Vigia,
}

__all__ = ["EQUIPA", "Aquisicao", "Copywriter", "SEO", "Designer",
           "Publicador", "Vendas", "Vigia"]
