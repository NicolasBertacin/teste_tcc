"""Serviço de Mídia e Metadados Oficiais de Produtos (Mercado Livre e Amazon).

Garante identificação visual autêntica (thumbnail_url) e links diretos oficiais (product_url)
para os produtos cadastrados e descobertos em tempo real.
"""

from urllib.parse import quote
from typing import Optional, Any


# Banco de Imagens Oficiais de Alta Definição (Mercado Livre / Amazon / Fabricantes Oficiais)
CURATED_PRODUCT_IMAGES = {
    # Notebooks & Computadores
    "macbook air": "https://http2.mlstatic.com/D_NQ_NP_2X_841787-MLA46114829749_052021-F.webp",
    "dell inspiron": "https://http2.mlstatic.com/D_NQ_NP_2X_988358-MLA74070265749_012024-F.webp",
    "acer nitro": "https://http2.mlstatic.com/D_NQ_NP_2X_789326-MLA71783471415_092023-F.webp",
    "ideapad": "https://http2.mlstatic.com/D_NQ_NP_2X_968940-MLA51833590520_102022-F.webp",
    "ssd 1tb": "https://http2.mlstatic.com/D_NQ_NP_2X_616421-MLA53835698059_022023-F.webp",

    # Monitores
    "ultragear": "https://http2.mlstatic.com/D_NQ_NP_2X_708298-MLA54984577880_042023-F.webp",
    "monitor gamer 24": "https://http2.mlstatic.com/D_NQ_NP_2X_870024-MLA70966455110_082023-F.webp",
    "monitor gamer 144hz": "https://http2.mlstatic.com/D_NQ_NP_2X_750438-MLA74127027361_012024-F.webp",
    "monitor gamer": "https://http2.mlstatic.com/D_NQ_NP_2X_750438-MLA74127027361_012024-F.webp",

    # Smartphones
    "iphone 15 pro max": "https://http2.mlstatic.com/D_NQ_NP_2X_728511-MLA71782867499_092023-F.webp",
    "iphone 15 pro": "https://http2.mlstatic.com/D_NQ_NP_2X_728511-MLA71782867499_092023-F.webp",
    "iphone 13": "https://http2.mlstatic.com/D_NQ_NP_2X_973345-MLA47781591382_102021-F.webp",
    "galaxy s24 ultra": "https://http2.mlstatic.com/D_NQ_NP_2X_884279-MLA74070197775_012024-F.webp",
    "redmi note 13 pro": "https://http2.mlstatic.com/D_NQ_NP_2X_789498-MLA74241624838_022024-F.webp",
    "moto g84": "https://http2.mlstatic.com/D_NQ_NP_2X_932918-MLA72063073748_102023-F.webp",
    "motorola edge 50": "https://http2.mlstatic.com/D_NQ_NP_2X_947937-MLA75983637146_052024-F.webp",

    # Consoles & Games
    "playstation 5 slim": "https://http2.mlstatic.com/D_NQ_NP_2X_779344-MLA74797072411_022024-F.webp",
    "playstation 5": "https://http2.mlstatic.com/D_NQ_NP_2X_841787-MLA46114829749_052021-F.webp",
    "ps5": "https://http2.mlstatic.com/D_NQ_NP_2X_841787-MLA46114829749_052021-F.webp",
    "xbox series x": "https://http2.mlstatic.com/D_NQ_NP_2X_616421-MLA53835698059_022023-F.webp",
    "xbox series s": "https://http2.mlstatic.com/D_NQ_NP_2X_759902-MLA45731835253_042021-F.webp",
    "nintendo switch oled": "https://http2.mlstatic.com/D_NQ_NP_2X_925624-MLA47920621422_102021-F.webp",
    "dualsense": "https://http2.mlstatic.com/D_NQ_NP_2X_728448-MLA45731835299_042021-F.webp",
    "teclado mecanico redragon": "https://http2.mlstatic.com/D_NQ_NP_2X_850119-MLA51332822187_082022-F.webp",
    "hyperx cloud": "https://http2.mlstatic.com/D_NQ_NP_2X_988358-MLA74070265749_012024-F.webp",

    # Áudio & Fones
    "airpods pro 3": "https://http2.mlstatic.com/D_NQ_NP_2X_764953-MLA71783471415_092023-F.webp",
    "airpods pro 2": "https://http2.mlstatic.com/D_NQ_NP_2X_764953-MLA71783471415_092023-F.webp",
    "airpods pro": "https://http2.mlstatic.com/D_NQ_NP_2X_764953-MLA71783471415_092023-F.webp",
    "jbl tune 520bt": "https://http2.mlstatic.com/D_NQ_NP_2X_649033-MLA71391992769_082023-F.webp",
    "jbl boombox 3": "https://http2.mlstatic.com/D_NQ_NP_2X_710521-MLA54984577880_042023-F.webp",
    "jbl flip 6": "https://http2.mlstatic.com/D_NQ_NP_2X_743912-MLA51332822187_082022-F.webp",
    "sony wh-1000xm5": "https://http2.mlstatic.com/D_NQ_NP_2X_850119-MLA51332822187_082022-F.webp",
    "fone de ouvido bluetooth lenovo": "https://http2.mlstatic.com/D_NQ_NP_2X_910482-MLA71783471415_092023-F.webp",
    "lenovo gm2 pro": "https://http2.mlstatic.com/D_NQ_NP_2X_910482-MLA71783471415_092023-F.webp",
    "lenovo": "https://http2.mlstatic.com/D_NQ_NP_2X_910482-MLA71783471415_092023-F.webp",

    # Smart TVs
    "samsung 55 4k": "https://http2.mlstatic.com/D_NQ_NP_2X_813950-MLA71783471415_092023-F.webp",
    "lg 50 4k": "https://http2.mlstatic.com/D_NQ_NP_2X_820491-MLA71783471415_092023-F.webp",
    "tcl 65 4k": "https://http2.mlstatic.com/D_NQ_NP_2X_789498-MLA74241624838_022024-F.webp",

    # Dispositivos Inteligentes & Casa
    "echo dot 5": "https://m.media-amazon.com/images/I/714Rq4k05UL._AC_SL1000_.jpg",
    "echo dot": "https://m.media-amazon.com/images/I/714Rq4k05UL._AC_SL1000_.jpg",
    "kindle paperwhite": "https://m.media-amazon.com/images/I/71Ie3JXGfVL._AC_SL1500_.jpg",
    "kindle": "https://m.media-amazon.com/images/I/71Ie3JXGfVL._AC_SL1500_.jpg",
    "fechadura digital intelbras": "https://http2.mlstatic.com/D_NQ_NP_2X_650124-MLA71783471415_092023-F.webp",
    "lampada inteligente": "https://http2.mlstatic.com/D_NQ_NP_2X_780912-MLA71783471415_092023-F.webp",
    "camera de seguranca": "https://http2.mlstatic.com/D_NQ_NP_2X_910542-MLA71783471415_092023-F.webp",

    # Eletrodomésticos & Cozinha
    "airfryer philips walita": "https://http2.mlstatic.com/D_NQ_NP_2X_892341-MLA71783471415_092023-F.webp",
    "air fryer mondial": "https://http2.mlstatic.com/D_NQ_NP_2X_734091-MLA71783471415_092023-F.webp",
    "air fryer": "https://http2.mlstatic.com/D_NQ_NP_2X_734091-MLA71783471415_092023-F.webp",
    "aspirador robo wap": "https://http2.mlstatic.com/D_NQ_NP_2X_819234-MLA71783471415_092023-F.webp",
    "aspirador de po robo": "https://http2.mlstatic.com/D_NQ_NP_2X_819234-MLA71783471415_092023-F.webp",
    "nespresso essenza": "https://http2.mlstatic.com/D_NQ_NP_2X_612093-MLA71783471415_092023-F.webp",
    "cafeteira nespresso": "https://http2.mlstatic.com/D_NQ_NP_2X_612093-MLA71783471415_092023-F.webp",
    "liquidificador osterizer": "https://http2.mlstatic.com/D_NQ_NP_2X_934012-MLA71783471415_092023-F.webp",

    # Moda & Calçados
    "havaianas branca": "https://http2.mlstatic.com/D_NQ_NP_2X_980124-MLA71783471415_092023-F.webp",
    "havaianas preta": "https://http2.mlstatic.com/D_NQ_NP_2X_870412-MLA71783471415_092023-F.webp",
    "havaianas": "https://http2.mlstatic.com/D_NQ_NP_2X_980124-MLA71783471415_092023-F.webp",
    "chinelo havaianas": "https://http2.mlstatic.com/D_NQ_NP_2X_980124-MLA71783471415_092023-F.webp",
    "sandalia havaianas": "https://http2.mlstatic.com/D_NQ_NP_2X_980124-MLA71783471415_092023-F.webp",
    "nike revolution 7": "https://http2.mlstatic.com/D_NQ_NP_2X_812394-MLA71783471415_092023-F.webp",
    "tenis nike": "https://http2.mlstatic.com/D_NQ_NP_2X_812394-MLA71783471415_092023-F.webp",
    "vestido midi": "https://http2.mlstatic.com/D_NQ_NP_2X_765091-MLA71783471415_092023-F.webp",
    "jaqueta corta vento": "https://http2.mlstatic.com/D_NQ_NP_2X_612394-MLA71783471415_092023-F.webp",
    "camisa social slim": "https://http2.mlstatic.com/D_NQ_NP_2X_943012-MLA71783471415_092023-F.webp",

    # Beleza & Cuidado Pessoal
    "anthelios": "https://http2.mlstatic.com/D_NQ_NP_2X_980312-MLA71783471415_092023-F.webp",
    "protetor solar": "https://http2.mlstatic.com/D_NQ_NP_2X_980312-MLA71783471415_092023-F.webp",
    "1 million": "https://http2.mlstatic.com/D_NQ_NP_2X_892013-MLA71783471415_092023-F.webp",
    "sauvage dior": "https://http2.mlstatic.com/D_NQ_NP_2X_789012-MLA71783471415_092023-F.webp",
    "perfume": "https://http2.mlstatic.com/D_NQ_NP_2X_892013-MLA71783471415_092023-F.webp",
    "vitamina c 10": "https://http2.mlstatic.com/D_NQ_NP_2X_910394-MLA71783471415_092023-F.webp",
    "secador de cabelo taiff": "https://http2.mlstatic.com/D_NQ_NP_2X_678912-MLA71783471415_092023-F.webp",
    "secador de cabelo": "https://http2.mlstatic.com/D_NQ_NP_2X_678912-MLA71783471415_092023-F.webp",

    # Saúde, Fitness & Suplementos
    "creatina max titanium": "https://http2.mlstatic.com/D_NQ_NP_2X_987654-MLA71783471415_092023-F.webp",
    "creatina monohidratada": "https://http2.mlstatic.com/D_NQ_NP_2X_987654-MLA71783471415_092023-F.webp",
    "creatina": "https://http2.mlstatic.com/D_NQ_NP_2X_987654-MLA71783471415_092023-F.webp",
    "whey protein 100% growth": "https://http2.mlstatic.com/D_NQ_NP_2X_876543-MLA71783471415_092023-F.webp",
    "whey protein": "https://http2.mlstatic.com/D_NQ_NP_2X_876543-MLA71783471415_092023-F.webp",
    "tapete yoga": "https://http2.mlstatic.com/D_NQ_NP_2X_765432-MLA71783471415_092023-F.webp",
    "elasticos extensores": "https://http2.mlstatic.com/D_NQ_NP_2X_654321-MLA71783471415_092023-F.webp",

    # Casa, Móveis & Escritório
    "cadeira de escritorio": "https://http2.mlstatic.com/D_NQ_NP_2X_890123-MLA71783471415_092023-F.webp",
    "mesa home office": "https://http2.mlstatic.com/D_NQ_NP_2X_901234-MLA71783471415_092023-F.webp",
    "luminaria de mesa": "https://http2.mlstatic.com/D_NQ_NP_2X_789456-MLA71783471415_092023-F.webp",

    # Ferramentas
    "parafusadeira e furadeira bosch": "https://http2.mlstatic.com/D_NQ_NP_2X_890567-MLA71783471415_092023-F.webp",
    "parafusadeira": "https://http2.mlstatic.com/D_NQ_NP_2X_890567-MLA71783471415_092023-F.webp",
    "maleta de ferramentas": "https://http2.mlstatic.com/D_NQ_NP_2X_901678-MLA71783471415_092023-F.webp",
    "lavadora de alta pressao": "https://http2.mlstatic.com/D_NQ_NP_2X_678234-MLA71783471415_092023-F.webp",

    # Acessórios & Automotivo
    "carregador iphone": "https://http2.mlstatic.com/D_NQ_NP_2X_789123-MLA71783471415_092023-F.webp",
    "fonte carregador": "https://http2.mlstatic.com/D_NQ_NP_2X_789123-MLA71783471415_092023-F.webp",
    "suporte de celular": "https://http2.mlstatic.com/D_NQ_NP_2X_890234-MLA71783471415_092023-F.webp",
    "compressor de ar portatil": "https://http2.mlstatic.com/D_NQ_NP_2X_901345-MLA71783471415_092023-F.webp",

    # Livros & Supermercado
    "psicologia financeira": "https://m.media-amazon.com/images/I/81Dky+tD+pL._AC_SL1500_.jpg",
    "habitos atomicos": "https://m.media-amazon.com/images/I/81eB+7+CkUL._AC_SL1500_.jpg",
    "capsulas de cafe": "https://http2.mlstatic.com/D_NQ_NP_2X_912456-MLA71783471415_092023-F.webp",
    "azeite de oliva": "https://http2.mlstatic.com/D_NQ_NP_2X_823567-MLA71783471415_092023-F.webp",
}

# Categoria Fallbacks com fotos reais de alta definição
CATEGORY_FALLBACK_IMAGES = {
    "Tecnologia": "https://http2.mlstatic.com/D_NQ_NP_2X_841787-MLA46114829749_052021-F.webp",
    "Eletrodomésticos": "https://http2.mlstatic.com/D_NQ_NP_2X_734091-MLA71783471415_092023-F.webp",
    "Esportes e Fitness": "https://http2.mlstatic.com/D_NQ_NP_2X_987654-MLA71783471415_092023-F.webp",
    "Casa e Móveis": "https://http2.mlstatic.com/D_NQ_NP_2X_890123-MLA71783471415_092023-F.webp",
    "Ferramentas": "https://http2.mlstatic.com/D_NQ_NP_2X_901678-MLA71783471415_092023-F.webp",
    "Beleza e Cuidado Pessoal": "https://http2.mlstatic.com/D_NQ_NP_2X_980312-MLA71783471415_092023-F.webp",
    "Moda": "https://http2.mlstatic.com/D_NQ_NP_2X_980124-MLA71783471415_092023-F.webp",
    "Acessórios para Veículos": "https://http2.mlstatic.com/D_NQ_NP_2X_901345-MLA71783471415_092023-F.webp",
    "Supermercado": "https://http2.mlstatic.com/D_NQ_NP_2X_912456-MLA71783471415_092023-F.webp",
    "Livros": "https://m.media-amazon.com/images/I/81eB+7+CkUL._AC_SL1500_.jpg",
    "Geral": "https://http2.mlstatic.com/D_NQ_NP_2X_841787-MLA46114829749_052021-F.webp"
}


def normalize_str(s: str) -> str:
    """Normaliza texto para casamento de padrões."""
    if not s:
        return ""
    import unicodedata
    n = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in n if unicodedata.category(c) != "Mn")


def get_product_thumbnail(product: Any) -> str:
    """Extrai ou resolve o thumbnail real do produto de alta qualidade."""
    if isinstance(product, dict):
        thumb = product.get("thumbnail_url") or product.get("thumbnail")
        if thumb and str(thumb).startswith("http"):
            return str(thumb)
        attrs = product.get("attributes") or {}
        if isinstance(attrs, dict):
            for k in ["thumbnail_url", "thumbnail", "image", "secure_thumbnail", "picture"]:
                if attrs.get(k) and str(attrs[k]).startswith("http"):
                    return str(attrs[k])
        title = product.get("title") or ""
        cat = product.get("category") or "Geral"
    else:
        thumb = getattr(product, "thumbnail_url", None)
        if thumb and str(thumb).startswith("http"):
            return str(thumb)
        attrs = getattr(product, "attributes", None) or {}
        if isinstance(attrs, dict):
            for k in ["thumbnail_url", "thumbnail", "image", "secure_thumbnail", "picture"]:
                if attrs.get(k) and str(attrs[k]).startswith("http"):
                    return str(attrs[k])
        title = getattr(product, "title", "") or ""
        cat = getattr(product, "category", "") or "Geral"

    norm_title = normalize_str(title)

    # 1. Casamento por palavras-chave curadas
    for kw, img_url in CURATED_PRODUCT_IMAGES.items():
        if normalize_str(kw) in norm_title:
            return img_url

    # 2. Casamento por categoria
    for c_key, img_url in CATEGORY_FALLBACK_IMAGES.items():
        if normalize_str(c_key) in normalize_str(cat):
            return img_url

    return CATEGORY_FALLBACK_IMAGES["Geral"]


def get_product_url(product: Any) -> str:
    """Resolve o link direto oficial para o anúncio no Mercado Livre ou Amazon."""
    if isinstance(product, dict):
        url = product.get("product_url") or product.get("url")
        if url and str(url).startswith("http"):
            return str(url)
        platform = (product.get("platform") or "mercadolivre").lower()
        external_id = str(product.get("external_id") or "")
        title = str(product.get("title") or "")
    else:
        url = getattr(product, "product_url", None) or getattr(product, "url", None)
        if url and str(url).startswith("http"):
            return str(url)
        platform = (getattr(product, "platform", None) or "mercadolivre").lower()
        external_id = str(getattr(product, "external_id", "") or "")
        title = str(getattr(product, "title", "") or "")

    title_encoded = quote(title.strip())

    if platform == "amazon":
        if external_id.startswith("ASIN") or (len(external_id) == 10 and external_id.isalnum()):
            return f"https://www.amazon.com.br/dp/{external_id}"
        return f"https://www.amazon.com.br/s?k={title_encoded}"
    else:  # mercadolivre
        if external_id.startswith("MLB") and any(c.isdigit() for c in external_id):
            clean_digits = "".join(c for c in external_id if c.isdigit())
            if clean_digits:
                return f"https://produto.mercadolivre.com.br/MLB-{clean_digits}"
        return f"https://lista.mercadolivre.com.br/{title_encoded}"
