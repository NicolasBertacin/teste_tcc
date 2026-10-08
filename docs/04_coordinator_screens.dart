// ==============================================================================
// ARQUIVO 4: MÓDULO DO COORDENADOR & GESTÃO ESCOLAR (PatriEdu)
// ==============================================================================
// Telas incluídas:
// 1. CoordinatorDashboardScreen (Painel Principal com Métricas, Gráficos e Ações Rápidas)
// 2. AssetManagementScreen (Gestão e Listagem de Patrimônios com Busca e Filtros)
// 3. NewAssetTombamentoScreen (Cadastro de Novo Bem, Dados Fiscais, Acessórios e QR Code)
// 4. TeacherManagementScreen (Gestão do Corpo Docente e Controle de Custódia)
// ==============================================================================

import 'package:flutter/material.dart';

// -----------------------------------------------------------------------------
// CORES & TEMA VISUAL OFICIAL PATRIEDU
// -----------------------------------------------------------------------------
class PatriEduColors {
  static const Color primary = Color(0xFF00236F);
  static const Color primaryContainer = Color(0xFF1E3A8A);
  static const Color secondary = Color(0xFF0051D5);
  static const Color secondaryContainer = Color(0xFF316BF3);
  static const Color secondaryFixed = Color(0xFFDBE1FF);
  static const Color onSecondaryFixed = Color(0xFF00174B);

  static const Color background = Color(0xFFFAF8FF);
  static const Color surface = Color(0xFFFAF8FF);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFF2F3FF);
  static const Color surfaceContainer = Color(0xFFEAEDFF);
  static const Color surfaceContainerHigh = Color(0xFFE2E7FF);
  static const Color surfaceContainerHighest = Color(0xFFDAE2FD);

  static const Color onSurface = Color(0xFF131B2E);
  static const Color onSurfaceVariant = Color(0xFF444651);
  static const Color outline = Color(0xFF757682);
  static const Color outlineVariant = Color(0xFFC5C5D3);

  static const Color tertiary = Color(0xFF004A31);
  static const Color tertiaryFixed = Color(0xFF6FFBBE);
  static const Color onTertiaryFixed = Color(0xFF002113);
  static const Color onTertiaryContainer = Color(0xFF27C38A);

  static const Color error = Color(0xFFBA1A1A);
  static const Color errorContainer = Color(0xFFFFDAD6);
  static const Color onErrorContainer = Color(0xFF93000A);
}

// -----------------------------------------------------------------------------
// MODELOS DE DADOS PARA O MÓDULO 4
// -----------------------------------------------------------------------------
enum StatusBem { emUso, disponivel, manutencao, baixa }

class BemPatrimonial {
  final String tombamento;
  final String serial;
  final String nome;
  final String categoria;
  final StatusBem status;
  final String responsavelOuLocal;
  final String subtexto;
  final String tempoRelativo;
  final double valor;

  BemPatrimonial({
    required this.tombamento,
    required this.serial,
    required this.nome,
    required this.categoria,
    required this.status,
    required this.responsavelOuLocal,
    required this.subtexto,
    required this.tempoRelativo,
    this.valor = 0.0,
  });
}

class DocenteItem {
  final String nome;
  final String matricula;
  final String disciplina;
  final int totalBens;
  final List<String> bensVinculados;
  final String fotoUrl;

  DocenteItem({
    required this.nome,
    required this.matricula,
    required this.disciplina,
    required this.totalBens,
    required this.bensVinculados,
    required this.fotoUrl,
  });
}

// =============================================================================
// 1. TELA: DASHBOARD DO COORDENADOR (CoordinatorDashboardScreen)
// =============================================================================
class CoordinatorDashboardScreen extends StatelessWidget {
  const CoordinatorDashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PatriEduColors.background,
      appBar: AppBar(
        backgroundColor: PatriEduColors.surfaceContainerLowest.withOpacity(0.95),
        elevation: 0.5,
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: PatriEduColors.primaryContainer,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.account_balance, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'PatriEdu',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: PatriEduColors.primary,
                  ),
                ),
                Text(
                  'E.E. Cecília Meireles',
                  style: TextStyle(
                    fontSize: 11,
                    color: PatriEduColors.onSurfaceVariant,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_none, color: PatriEduColors.primary),
                onPressed: () {},
              ),
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: PatriEduColors.error,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
          const Padding(
            padding: EdgeInsets.only(right: 16, left: 4),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: PatriEduColors.primaryContainer,
              child: Text(
                'M',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Saudação
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Row(
                      children: [
                        Icon(Icons.verified_user, size: 16, color: PatriEduColors.primary),
                        SizedBox(width: 4),
                        Text(
                          'GESTÃO DE PATRIMÔNIO • 2025',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                            color: PatriEduColors.primary,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Olá, Profa. Márcia 👋',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: PatriEduColors.onSurface,
                      ),
                    ),
                    Text(
                      'Painel de controle e inventário atualizado',
                      style: TextStyle(
                        fontSize: 12,
                        color: PatriEduColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Hero Card Resumo Financeiro / Global
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [
                    PatriEduColors.primary,
                    PatriEduColors.primaryContainer,
                    PatriEduColors.secondary,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: PatriEduColors.primary.withOpacity(0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(Icons.account_balance, color: Colors.white, size: 18),
                          ),
                          const SizedBox(width: 8),
                          const Text(
                            'INVENTÁRIO GLOBAL ATIVO',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: PatriEduColors.tertiaryFixed,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Row(
                          children: [
                            CircleAvatar(radius: 3, backgroundColor: PatriEduColors.onTertiaryFixed),
                            SizedBox(width: 4),
                            Text(
                              'Auditado 100%',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: PatriEduColors.onTertiaryFixed,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Bens Registrados',
                              style: TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                            const SizedBox(height: 2),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.baseline,
                              textBaseline: TextBaseline.alphabetic,
                              children: const [
                                Text(
                                  '348',
                                  style: TextStyle(
                                    fontSize: 26,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                SizedBox(width: 4),
                                Text('itens', style: TextStyle(color: Colors.white70, fontSize: 12)),
                              ],
                            ),
                            const SizedBox(height: 2),
                            const Text(
                              '+14 neste mês',
                              style: TextStyle(color: Color(0xFFB6C4FF), fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      Container(width: 1, height: 45, color: Colors.white24),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              'Valor Estimado',
                              style: TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'R$ 486.250',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'Depreciação: -4.2%',
                              style: TextStyle(color: Color(0xFFB6C4FF), fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Métricas 2x2
            const Text(
              'Status Operacional',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: PatriEduColors.onSurface,
              ),
            ),
            const SizedBox(height: 10),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.4,
              children: const [
                _StatusCard(
                  titulo: 'Em Uso',
                  quantidade: 214,
                  porcentagem: 0.61,
                  percentualStr: '61%',
                  icone: Icons.devices,
                  corIcone: PatriEduColors.secondary,
                  corBarra: PatriEduColors.secondary,
                  corFundoIcone: PatriEduColors.surfaceContainerHigh,
                ),
                _StatusCard(
                  titulo: 'Disponíveis',
                  quantidade: 98,
                  porcentagem: 0.28,
                  percentualStr: '28%',
                  icone: Icons.check_circle,
                  corIcone: PatriEduColors.onTertiaryContainer,
                  corBarra: PatriEduColors.onTertiaryContainer,
                  corFundoIcone: PatriEduColors.surfaceContainerLow,
                ),
                _StatusCard(
                  titulo: 'Em Manutenção',
                  quantidade: 26,
                  porcentagem: 0.08,
                  percentualStr: '8%',
                  icone: Icons.build_circle,
                  corIcone: Color(0xFFB45309),
                  corBarra: PatriEduColors.secondaryContainer,
                  corFundoIcone: PatriEduColors.surfaceContainer,
                ),
                _StatusCard(
                  titulo: 'Baixa / Inativos',
                  quantidade: 10,
                  porcentagem: 0.03,
                  percentualStr: '3%',
                  icone: Icons.archive,
                  corIcone: PatriEduColors.error,
                  corBarra: PatriEduColors.error,
                  corFundoIcone: PatriEduColors.errorContainer,
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Ações Rápidas
            const Text(
              'Ações de Gestão',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: PatriEduColors.onSurface,
              ),
            ),
            const SizedBox(height: 10),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 1.6,
              children: [
                _ActionCard(
                  titulo: 'Novo Tombamento',
                  subtitulo: 'Cadastrar novo bem',
                  icone: Icons.add_box,
                  corFundo: PatriEduColors.primary,
                  corTexto: Colors.white,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const NewAssetTombamentoScreen()),
                    );
                  },
                ),
                _ActionCard(
                  titulo: 'Atribuir Item',
                  subtitulo: 'Entregar para docente',
                  icone: Icons.assignment_ind,
                  corFundo: PatriEduColors.secondary,
                  corTexto: Colors.white,
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Navegando para Atribuição de Custódia')),
                    );
                  },
                ),
                _ActionCard(
                  titulo: 'Registrar Devolução',
                  subtitulo: 'Checagem e retorno',
                  icone: Icons.assignment_return,
                  corFundo: PatriEduColors.surfaceContainerLowest,
                  corTexto: PatriEduColors.onSurface,
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Navegando para Registro de Devolução')),
                    );
                  },
                ),
                _ActionCard(
                  titulo: 'Leitor QR Code',
                  subtitulo: 'Escaneamento rápido',
                  icone: Icons.qr_code_scanner,
                  corFundo: PatriEduColors.surfaceContainerLowest,
                  corTexto: PatriEduColors.onSurface,
                  onTap: () {
                    _showScannerModal(context);
                  },
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Bens por Categoria
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: PatriEduColors.surfaceContainerLowest,
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [
                  BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 1)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Bens por Categoria',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: PatriEduColors.onSurface,
                    ),
                  ),
                  Text(
                    'Distribuição no campus escolar',
                    style: TextStyle(fontSize: 12, color: PatriEduColors.onSurfaceVariant),
                  ),
                  SizedBox(height: 14),
                  _CategoryProgress(
                    icone: Icons.computer,
                    nome: 'Informática & TI',
                    quantidade: 142,
                    percentual: 0.41,
                    percentualTexto: '41%',
                    cor: PatriEduColors.secondary,
                  ),
                  SizedBox(height: 10),
                  _CategoryProgress(
                    icone: Icons.videocam,
                    nome: 'Audiovisual & Multimídia',
                    quantidade: 86,
                    percentual: 0.25,
                    percentualTexto: '25%',
                    cor: Color(0xFF4059AA),
                  ),
                  SizedBox(height: 10),
                  _CategoryProgress(
                    icone: Icons.chair,
                    nome: 'Mobiliário Escolar',
                    quantidade: 78,
                    percentual: 0.22,
                    percentualTexto: '22%',
                    cor: PatriEduColors.primaryContainer,
                  ),
                  SizedBox(height: 10),
                  _CategoryProgress(
                    icone: Icons.science,
                    nome: 'Laboratório de Ciências',
                    quantidade: 42,
                    percentual: 0.12,
                    percentualTexto: '12%',
                    cor: PatriEduColors.onTertiaryContainer,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  static void _showScannerModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.qr_code_scanner, size: 48, color: PatriEduColors.secondary),
            const SizedBox(height: 12),
            const Text(
              'Leitor de Plaqueta Patrimonial',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Aponte a câmera para o QR Code ou código de barras da plaqueta.',
              textAlign: TextAlign.center,
              style: TextStyle(color: PatriEduColors.onSurfaceVariant),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: PatriEduColors.primary,
                minimumSize: const Size.fromHeight(48),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: () => Navigator.pop(context),
              child: const Text('Simular Leitura (#PAT-2024-0104)'),
            ),
          ],
        ),
      ),
    );
  }
}

// =============================================================================
// 2. TELA: GESTÃO DE PATRIMÔNIOS (AssetManagementScreen)
// =============================================================================
class AssetManagementScreen extends StatefulWidget {
  const AssetManagementScreen({Key? key}) : super(key: key);

  @override
  State<AssetManagementScreen> createState() => _AssetManagementScreenState();
}

class _AssetManagementScreenState extends State<AssetManagementScreen> {
  String selectedFilter = 'Todos';
  String searchQuery = '';

  final List<BemPatrimonial> bens = [
    BemPatrimonial(
      tombamento: '#PAT-2024-0104',
      serial: 'LNV-883921-BR',
      nome: 'Notebook Lenovo ThinkPad L14',
      categoria: 'Informática',
      status: StatusBem.emUso,
      responsavelOuLocal: 'Prof. Marcos Andrade (Matemática)',
      subtexto: 'Sala dos Professores / Bloco B',
      tempoRelativo: 'Há 2h',
    ),
    BemPatrimonial(
      tombamento: '#PAT-2023-0056',
      serial: 'EP-99120-X',
      nome: 'Projetor Epson PowerLite E20',
      categoria: 'Audiovisual',
      status: StatusBem.disponivel,
      responsavelOuLocal: 'Armário de Multimídia',
      subtexto: 'Prateleira 03 • Gabinete Fechado',
      tempoRelativo: 'Disponível',
    ),
    BemPatrimonial(
      tombamento: '#PAT-2024-0211',
      serial: 'JBL-AUD-441',
      nome: 'Kit Caixa de Som Portátil JBL + Microfones',
      categoria: 'Audiovisual',
      status: StatusBem.manutencao,
      responsavelOuLocal: 'Ordem de Serviço: #OS-4412',
      subtexto: 'Cabo com mau contato enviado para assistência',
      tempoRelativo: 'Em Manutenção',
    ),
    BemPatrimonial(
      tombamento: '#PAT-2024-0300',
      serial: 'SM-T380-01',
      nome: 'Tablet Samsung Galaxy Tab A9+ (Kit 10 un.)',
      categoria: 'Informática',
      status: StatusBem.emUso,
      responsavelOuLocal: 'Profa. Juliana Santos (Português)',
      subtexto: 'Sala de Leitura / Bloco C',
      tempoRelativo: 'Há 1 dia',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final filteredBens = bens.where((bem) {
      final matchesSearch = bem.nome.toLowerCase().contains(searchQuery.toLowerCase()) ||
          bem.tombamento.toLowerCase().contains(searchQuery.toLowerCase());
      if (selectedFilter == 'Todos') return matchesSearch;
      if (selectedFilter == 'Em Uso') return matchesSearch && bem.status == StatusBem.emUso;
      if (selectedFilter == 'Disponíveis') return matchesSearch && bem.status == StatusBem.disponivel;
      if (selectedFilter == 'Manutenção') return matchesSearch && bem.status == StatusBem.manutencao;
      return matchesSearch;
    }).toList();

    return Scaffold(
      backgroundColor: PatriEduColors.background,
      appBar: AppBar(
        title: const Text('Gestão de Patrimônios', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: PatriEduColors.surfaceContainerLowest,
        elevation: 0.5,
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: PatriEduColors.secondary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Novo Patrimônio', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const NewAssetTombamentoScreen()),
          );
        },
      ),
      body: Column(
        children: [
          // Barra de Busca & Ações
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    height: 48,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: PatriEduColors.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.search, color: PatriEduColors.outline),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            onChanged: (val) => setState(() => searchQuery = val),
                            decoration: const InputDecoration(
                              hintText: 'Buscar tombamento, série, modelo...',
                              border: InputBorder.none,
                              isDense: true,
                            ),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.qr_code_scanner, color: PatriEduColors.primary),
                          onPressed: () => CoordinatorDashboardScreen._showScannerModal(context),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Chips de Filtro
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _buildFilterChip('Todos', 348),
                const SizedBox(width: 8),
                _buildFilterChip('Em Uso', 214),
                const SizedBox(width: 8),
                _buildFilterChip('Disponíveis', 98),
                const SizedBox(width: 8),
                _buildFilterChip('Manutenção', 26),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Lista de Cards
          Expanded(
            child: filteredBens.isEmpty
                ? const Center(child: Text('Nenhum patrimônio encontrado.'))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: filteredBens.length,
                    itemBuilder: (context, index) {
                      final item = filteredBens[index];
                      return _AssetItemCard(bem: item);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, int total) {
    final isSelected = selectedFilter == label;
    return ChoiceChip(
      selected: isSelected,
      label: Text('$label ($total)'),
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: isSelected ? Colors.white : PatriEduColors.onSurfaceVariant,
      ),
      selectedColor: PatriEduColors.primary,
      backgroundColor: PatriEduColors.surfaceContainerLowest,
      onSelected: (val) {
        if (val) setState(() => selectedFilter = label);
      },
    );
  }
}

// =============================================================================
// 3. TELA: NOVO TOMBAMENTO / CADASTRO DE BEM (NewAssetTombamentoScreen - RF-07)
// =============================================================================
class NewAssetTombamentoScreen extends StatefulWidget {
  const NewAssetTombamentoScreen({Key? key}) : super(key: key);

  @override
  State<NewAssetTombamentoScreen> createState() => _NewAssetTombamentoScreenState();
}

class _NewAssetTombamentoScreenState extends State<NewAssetTombamentoScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _tombamentoCtrl = TextEditingController(text: 'PAT-2025-0142');
  final TextEditingController _nomeCtrl = TextEditingController(text: 'Notebook Educacional Dell Latitude 3420');
  final TextEditingController _marcaCtrl = TextEditingController(text: 'Dell');
  final TextEditingController _modeloCtrl = TextEditingController(text: 'Latitude 3420');
  final TextEditingController _serialCtrl = TextEditingController(text: 'CN-0J138X-72481-28B');
  final TextEditingController _nfCtrl = TextEditingController(text: 'NF-e 004.819.330');
  final TextEditingController _valorCtrl = TextEditingController(text: '3.450,00');
  final TextEditingController _acessorioInputCtrl = TextEditingController();

  String _categoriaSelecionada = 'Informática';
  String _estadoFisico = 'Novo / Lacrado';
  String _origemRecurso = 'FNDE / MEC';
  String _localPadrao = 'Sala de Informática (Lab 1)';

  final List<String> _acessorios = [
    'Fonte / Carregador 65W',
    'Cabo de Força ABNT',
    'Maleta Protetora',
  ];

  void _gerarCodigoAutomatico() {
    final rand = 1000 + (DateTime.now().millisecond % 9000);
    setState(() {
      _tombamentoCtrl.text = 'PAT-2025-$rand';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Novo código gerado: ${_tombamentoCtrl.text}')),
    );
  }

  void _adicionarAcessorio() {
    final text = _acessorioInputCtrl.text.trim();
    if (text.isNotEmpty) {
      setState(() {
        _acessorios.add(text);
        _acessorioInputCtrl.clear();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: PatriEduColors.background,
      appBar: AppBar(
        title: const Text('Novo Tombamento', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: PatriEduColors.surfaceContainerLowest,
        elevation: 0.5,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Banner SEDUC RF-07
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: PatriEduColors.primary,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified_user, color: PatriEduColors.tertiaryFixed, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'RF-07 • Diretriz SEDUC',
                            style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            'Registro e Tombamento Oficial',
                            style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            'Geração de identificador digital e rastreabilidade patrimonial.',
                            style: TextStyle(color: Colors.white70, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // SEÇÃO 1: IDENTIFICAÇÃO DO BEM
              _buildSectionCard(
                titulo: '1. Identificação do Bem',
                icone: Icons.inventory_2,
                children: [
                  const Text('Número de Tombamento / Plaqueta *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: _tombamentoCtrl,
                          decoration: _inputDecoration('Ex: PAT-2025-0000', Icons.tag),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: PatriEduColors.surfaceContainer,
                          foregroundColor: PatriEduColors.primary,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
                        ),
                        onPressed: _gerarCodigoAutomatico,
                        icon: const Icon(Icons.autorenew, size: 16),
                        label: const Text('Auto', style: TextStyle(fontSize: 12)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  const Text('Nome / Descrição Detalhada *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _nomeCtrl,
                    decoration: _inputDecoration('Nome do bem', Icons.devices),
                  ),
                  const SizedBox(height: 12),

                  const Text('Categoria do Ativo', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    children: ['Informática', 'Audiovisual', 'Mobiliário', 'Laboratório', 'Esportivo'].map((cat) {
                      final isSelected = _categoriaSelecionada == cat;
                      return ChoiceChip(
                        selected: isSelected,
                        label: Text(cat),
                        selectedColor: PatriEduColors.secondary,
                        labelStyle: TextStyle(
                          fontSize: 12,
                          color: isSelected ? Colors.white : PatriEduColors.onSurfaceVariant,
                        ),
                        onSelected: (val) {
                          if (val) setState(() => _categoriaSelecionada = cat);
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Marca / Fabricante', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            TextFormField(controller: _marcaCtrl, decoration: _inputDecoration('Marca', null)),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Modelo / Linha', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            TextFormField(controller: _modeloCtrl, decoration: _inputDecoration('Modelo', null)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  const Text('Número de Série (S/N)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _serialCtrl,
                    decoration: _inputDecoration('S/N de fábrica', Icons.barcode_reader),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // SEÇÃO 2: DADOS FISCAIS
              _buildSectionCard(
                titulo: '2. Origem & Dados Fiscais',
                icone: Icons.receipt_long,
                children: [
                  const Text('Origem do Recurso', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: _origemRecurso,
                    items: ['FNDE / MEC', 'Governo do Estado / SEDUC', 'Doação APM', 'Recurso Próprio']
                        .map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 13))))
                        .toList(),
                    onChanged: (val) => setState(() => _origemRecurso = val!),
                    decoration: _inputDecoration('', null),
                  ),
                  const SizedBox(height: 12),

                  const Text('Nota Fiscal / Processo', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _nfCtrl,
                    decoration: _inputDecoration('Número da NF-e', Icons.description),
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Data de Entrada', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            TextFormField(
                              readOnly: true,
                              initialValue: '16/04/2025',
                              decoration: _inputDecoration('Data', Icons.calendar_today),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Valor de Compra (R$)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            TextFormField(
                              controller: _valorCtrl,
                              keyboardType: TextInputType.number,
                              decoration: _inputDecoration('0,00', Icons.attach_money),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // SEÇÃO 3: ALOCAÇÃO E ACESSÓRIOS
              _buildSectionCard(
                titulo: '3. Alocação & Estado Físico',
                icone: Icons.location_on,
                children: [
                  const Text('Local de Armazenamento / Lotação', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    value: _localPadrao,
                    items: [
                      'Sala de Informática (Lab 1)',
                      'Armário Central Bloco A',
                      'Almoxarifado Geral',
                      'Secretaria Escolar',
                    ].map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 13))))
                        .toList(),
                    onChanged: (val) => setState(() => _localPadrao = val!),
                    decoration: _inputDecoration('', null),
                  ),
                  const SizedBox(height: 12),

                  const Text('Estado de Conservação', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 8,
                    children: ['Novo / Lacrado', 'Excelente', 'Bom', 'Requer Revisão'].map((est) {
                      final isSelected = _estadoFisico == est;
                      return ChoiceChip(
                        selected: isSelected,
                        label: Text(est),
                        selectedColor: PatriEduColors.secondary,
                        labelStyle: TextStyle(
                          fontSize: 12,
                          color: isSelected ? Colors.white : PatriEduColors.onSurfaceVariant,
                        ),
                        onSelected: (val) {
                          if (val) setState(() => _estadoFisico = est);
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 12),

                  const Text('Acessórios e Periféricos Inclusos', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: _acessorios.map((acc) {
                      return Chip(
                        label: Text(acc, style: const TextStyle(fontSize: 11)),
                        backgroundColor: PatriEduColors.surfaceContainerHigh,
                        deleteIcon: const Icon(Icons.close, size: 14),
                        onDeleted: () {
                          setState(() => _acessorios.remove(acc));
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _acessorioInputCtrl,
                          decoration: _inputDecoration('Adicionar item (ex: Mouse)', null),
                          onSubmitted: (_) => _adicionarAcessorio(),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        style: IconButton.styleFrom(backgroundColor: PatriEduColors.surfaceContainer),
                        icon: const Icon(Icons.add, color: PatriEduColors.primary),
                        onPressed: _adicionarAcessorio,
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Botões de Ação
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: PatriEduColors.primary,
                  foregroundColor: Colors.white,
                  minimumSize: const Size.fromHeight(50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.save),
                label: const Text('Cadastrar Patrimônio no Acervo', style: TextStyle(fontWeight: FontWeight.bold)),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Patrimônio ${_tombamentoCtrl.text} cadastrado com sucesso!')),
                  );
                  Navigator.pop(context);
                },
              ),
              const SizedBox(height: 10),
              OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: PatriEduColors.secondary,
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                icon: const Icon(Icons.print),
                label: const Text('Salvar e Imprimir Etiqueta QR Code'),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Etiqueta enviada para fila de impressão.')),
                  );
                },
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionCard({required String titulo, required IconData icone, required List<Widget> children}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: PatriEduColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icone, color: PatriEduColors.primary, size: 20),
              const SizedBox(width: 8),
              Text(titulo, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            ],
          ),
          const Divider(height: 20),
          ...children,
        ],
      ),
    );
  }

  InputDecoration _inputDecoration(String hint, IconData? icon) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: icon != null ? Icon(icon, size: 18, color: PatriEduColors.outline) : null,
      filled: true,
      fillColor: PatriEduColors.surfaceContainerLow,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
    );
  }
}

// =============================================================================
// 4. TELA: GESTÃO DE DOCENTES (TeacherManagementScreen)
// =============================================================================
class TeacherManagementScreen extends StatefulWidget {
  const TeacherManagementScreen({Key? key}) : super(key: key);

  @override
  State<TeacherManagementScreen> createState() => _TeacherManagementScreenState();
}

class _TeacherManagementScreenState extends State<TeacherManagementScreen> {
  String searchDocente = '';

  final List<DocenteItem> docentes = [
    DocenteItem(
      nome: 'Prof. Marcos Andrade',
      matricula: '#DOC-8492',
      disciplina: 'Matemática (Ensino Médio)',
      totalBens: 4,
      bensVinculados: [
        'Notebook Lenovo ThinkPad E14 (#PAT-2024-0104)',
        'Projetor Epson PowerLite (#PAT-2023-0891)',
        'Kit Teclado + Mouse Dell Wireless (#PAT-2023-0112)',
      ],
      fotoUrl: '',
    ),
    DocenteItem(
      nome: 'Profa. Juliana Santos',
      matricula: '#DOC-7310',
      disciplina: 'Língua Portuguesa & Literatura',
      totalBens: 1,
      bensVinculados: [
        'Kit 10 Tablets Galaxy Tab A9+ (#PAT-2024-0300)',
      ],
      fotoUrl: '',
    ),
    DocenteItem(
      nome: 'Prof. Carlos Silva',
      matricula: '#DOC-6105',
      disciplina: 'Ciências & Biologia',
      totalBens: 3,
      bensVinculados: [
        'Microscópio Biológico Binocular (#PAT-2023-0442)',
        'Smart TV Samsung 55" UHD (#PAT-2024-0019)',
      ],
      fotoUrl: '',
    ),
    DocenteItem(
      nome: 'Profa. Renata Farias',
      matricula: '#DOC-9214',
      disciplina: 'História & Filosofia',
      totalBens: 0,
      bensVinculados: [],
      fotoUrl: '',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final filtered = docentes.where((doc) {
      return doc.nome.toLowerCase().contains(searchDocente.toLowerCase()) ||
          doc.disciplina.toLowerCase().contains(searchDocente.toLowerCase()) ||
          doc.matricula.toLowerCase().contains(searchDocente.toLowerCase());
    }).toList();

    return Scaffold(
      backgroundColor: PatriEduColors.background,
      appBar: AppBar(
        title: const Text('Gestão de Docentes', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: PatriEduColors.surfaceContainerLowest,
        elevation: 0.5,
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: PatriEduColors.primary,
        icon: const Icon(Icons.person_add, color: Colors.white),
        label: const Text('+ Docente', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Abrindo cadastro de novo docente.')),
          );
        },
      ),
      body: Column(
        children: [
          // Header Informativo
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: PatriEduColors.surfaceContainer,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      Text('42 professores cadastrados', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      Text('214 itens sob custódia', style: TextStyle(fontSize: 12, color: PatriEduColors.primary)),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                // Campo de Busca
                TextField(
                  onChanged: (val) => setState(() => searchDocente = val),
                  decoration: InputDecoration(
                    hintText: 'Buscar por nome, disciplina ou matrícula...',
                    prefixIcon: const Icon(Icons.search, color: PatriEduColors.outline),
                    filled: true,
                    fillColor: PatriEduColors.surfaceContainerLowest,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                ),
              ],
            ),
          ),

          // Lista de Docentes
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final doc = filtered[index];
                return _TeacherCard(docente: doc);
              },
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// WIDGETS AUXILIARES & COMPONENTES REUTILIZÁVEIS
// =============================================================================
class _StatusCard extends StatelessWidget {
  final String titulo;
  final int quantidade;
  final double porcentagem;
  final String percentualStr;
  final IconData icone;
  final Color corIcone;
  final Color corBarra;
  final Color corFundoIcone;

  const _StatusCard({
    required this.titulo,
    required this.quantidade,
    required this.porcentagem,
    required this.percentualStr,
    required this.icone,
    required this.corIcone,
    required this.corBarra,
    required this.corFundoIcone,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: PatriEduColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 3)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(color: corFundoIcone, borderRadius: BorderRadius.circular(8)),
                child: Icon(icone, size: 18, color: corIcone),
              ),
              Text(
                percentualStr,
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: PatriEduColors.onSurfaceVariant),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(titulo, style: const TextStyle(fontSize: 11, color: PatriEduColors.onSurfaceVariant)),
              Text('$quantidade itens', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            ],
          ),
          LinearProgressIndicator(
            value: porcentagem,
            backgroundColor: PatriEduColors.surfaceContainer,
            valueColor: AlwaysStoppedAnimation<Color>(corBarra),
            minHeight: 4,
            borderRadius: BorderRadius.circular(4),
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  final String titulo;
  final String subtitulo;
  final IconData icone;
  final Color corFundo;
  final Color corTexto;
  final VoidCallback onTap;

  const _ActionCard({
    required this.titulo,
    required this.subtitulo,
    required this.icone,
    required this.corFundo,
    required this.corTexto,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: corFundo,
          borderRadius: BorderRadius.circular(14),
          boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 3)],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icone, color: corTexto, size: 22),
            const SizedBox(height: 6),
            Text(titulo, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: corTexto)),
            Text(subtitulo, style: TextStyle(fontSize: 10, color: corTexto.withOpacity(0.8))),
          ],
        ),
      ),
    );
  }
}

class _CategoryProgress extends StatelessWidget {
  final IconData icone;
  final String nome;
  final int quantidade;
  final double percentual;
  final String percentualTexto;
  final Color cor;

  const _CategoryProgress({
    required this.icone,
    required this.nome,
    required this.quantidade,
    required this.percentual,
    required this.percentualTexto,
    required this.cor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(icone, size: 16, color: cor),
                const SizedBox(width: 6),
                Text(nome, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
              ],
            ),
            Text('$quantidade ($percentualTexto)', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: percentual,
          backgroundColor: PatriEduColors.surfaceContainer,
          valueColor: AlwaysStoppedAnimation<Color>(cor),
          minHeight: 6,
          borderRadius: BorderRadius.circular(6),
        ),
      ],
    );
  }
}

class _AssetItemCard extends StatelessWidget {
  final BemPatrimonial bem;

  const _AssetItemCard({required this.bem});

  @override
  Widget build(BuildContext context) {
    Color statusColor;
    String statusTexto;

    switch (bem.status) {
      case StatusBem.emUso:
        statusColor = PatriEduColors.secondary;
        statusTexto = 'EM USO';
        break;
      case StatusBem.disponivel:
        statusColor = PatriEduColors.onTertiaryContainer;
        statusTexto = 'DISPONÍVEL';
        break;
      case StatusBem.manutencao:
        statusColor = const Color(0xFFB45309);
        statusTexto = 'MANUTENÇÃO';
        break;
      case StatusBem.baixa:
        statusColor = PatriEduColors.error;
        statusTexto = 'INATIVO';
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: PatriEduColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 3)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${bem.tombamento} • S/N: ${bem.serial}',
                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: PatriEduColors.primary),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  statusTexto,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            bem.nome,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: PatriEduColors.onSurface),
          ),
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: PatriEduColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                const Icon(Icons.location_on, size: 14, color: PatriEduColors.outline),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    '${bem.responsavelOuLocal} • ${bem.subtexto}',
                    style: const TextStyle(fontSize: 11, color: PatriEduColors.onSurfaceVariant),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TeacherCard extends StatelessWidget {
  final DocenteItem docente;

  const _TeacherCard({required this.docente});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: PatriEduColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 3)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const CircleAvatar(
                radius: 20,
                backgroundColor: PatriEduColors.primaryContainer,
                child: Icon(Icons.person, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(docente.nome, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    Text('${docente.matricula} • ${docente.disciplina}', style: const TextStyle(fontSize: 11, color: PatriEduColors.onSurfaceVariant)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: PatriEduColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  docente.totalBens > 0 ? '${docente.totalBens} bens vinculados' : 'Nenhum bem vinculado',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: docente.totalBens > 0 ? PatriEduColors.secondary : PatriEduColors.onSurfaceVariant,
                  ),
                ),
                if (docente.totalBens > 0)
                  const Icon(Icons.keyboard_arrow_down, size: 18, color: PatriEduColors.outline),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
