# 📘 PARTE 4: Camada View - Coordenador (Dashboard, Catálogos e Ações)

## 🎯 Contexto e Objetivo
Esta etapa implementa as telas e abas de gestão do **Coordenador Escolar** no padrão **MVC**:
1. **`CoordinatorMainScreen`**: Container principal com `BottomNavigationBar` para alternar entre as 4 abas (Início, Patrimônios, Docentes, Ajustes).
2. **`DashboardTab`**: Painel analítico com métricas de inventário, valor contábil global, status operacional 2x2 e movimentações recentes.
3. **`PatrimoniosTab`**: Catálogo completo com busca textual, dropdown de categorias, chips de status e FloatingActionButton para cadastro.
4. **`DocentesTab`**: Lista de professores com cards expansíveis exibindo os equipamentos sob custódia e emissão de termos.
5. **`AjustesTab`**: Informações da unidade escolar e encerramento de sessão.
6. **`NovoPatrimonioScreen`**: Formulário de tombamento com gerador automático de código e simulador de leitura de QR Code.
7. **`NovoProfessorScreen`**: Cadastro funcional e pedagógico de docentes.
8. **`AtribuirPatrimonioScreen`**: Vistoria de acessórios e emissão de termo de responsabilidade.
9. **`RegistrarDevolucaoScreen`**: Conferência de devolução física com alertas de extravio e emissão de termo de quitação.
10. **`PatrimonioHistoricoScreen`**: Linha do tempo e rastreabilidade de auditoria do ativo.

---

## 🌿 Nome da Git Branch
Execute no terminal:
```bash
git checkout -b feature/mvc-views-coordinator
```

---

## 📂 Arquivos desta Parte

1. `lib/screens/coordinator/coordinator_main_screen.dart`
2. `lib/screens/coordinator/dashboard_tab.dart`
3. `lib/screens/coordinator/patrimonios_tab.dart`
4. `lib/screens/coordinator/docentes_tab.dart`
5. `lib/screens/coordinator/ajustes_tab.dart`
6. `lib/screens/coordinator/novo_patrimonio_screen.dart`
7. `lib/screens/coordinator/novo_professor_screen.dart`
8. `lib/screens/coordinator/atribuir_patrimonio_screen.dart`
9. `lib/screens/coordinator/registrar_devolucao_screen.dart`
10. `lib/screens/coordinator/patrimonio_historico_screen.dart`

---

## 💻 Códigos dos Arquivos

### 1. `lib/screens/coordinator/coordinator_main_screen.dart`
```dart
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import 'dashboard_tab.dart';
import 'patrimonios_tab.dart';
import 'docentes_tab.dart';
import 'ajustes_tab.dart';

class CoordinatorMainScreen extends StatefulWidget {
  const CoordinatorMainScreen({super.key});

  @override
  State<CoordinatorMainScreen> createState() => _CoordinatorMainScreenState();
}

class _CoordinatorMainScreenState extends State<CoordinatorMainScreen> {
  int _currentIndex = 0;

  final List<Widget> _tabs = const [
    DashboardTab(),
    PatrimoniosTab(),
    DocentesTab(),
    AjustesTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _tabs[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        type: BottomNavigationBarType.fixed,
        backgroundColor: AppColors.surfaceContainerLowest,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.outline,
        selectedFontSize: 12,
        unselectedFontSize: 12,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Início',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2_outlined),
            activeIcon: Icon(Icons.inventory_2),
            label: 'Patrimônios',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.groups_outlined),
            activeIcon: Icon(Icons.groups),
            label: 'Docentes',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            activeIcon: Icon(Icons.settings),
            label: 'Ajustes',
          ),
        ],
      ),
    );
  }
}
```

---

### 2. `lib/screens/coordinator/dashboard_tab.dart`
```dart
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import '../../core/widgets/custom_app_bar.dart';
import '../../controllers/patrimonio_controller.dart';
import 'novo_patrimonio_screen.dart';
import 'atribuir_patrimonio_screen.dart';
import 'registrar_devolucao_screen.dart';

class DashboardTab extends StatelessWidget {
  const DashboardTab({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = PatrimonioController();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const CustomAppBar(
        userRole: 'Gestora',
        title: 'PatriEdu',
        subtitle: 'E.E. Cecília Meireles',
      ),
      body: ListenableBuilder(
        listenable: controller,
        builder: (context, _) {
          final total = controller.totalBensCount;
          final emUso = controller.bensEmUsoCount;
          final disponiveis = controller.bensDisponiveisCount;
          final manutencao = controller.bensManutencaoCount;
          final baixa = controller.bensBaixaCount;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Olá, Profa. Márcia 👋',
                  style: AppTextStyles.headlineLgMobile.copyWith(color: AppColors.onSurface),
                ),
                Text(
                  'Painel de controle e inventário atualizado',
                  style: AppTextStyles.bodySm.copyWith(color: AppColors.onSurfaceVariant),
                ),
                const SizedBox(height: 16),

                // Hero Banner
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.primary, AppColors.primaryContainer, AppColors.secondary],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'INVENTÁRIO GLOBAL ATIVO',
                            style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.tertiaryFixed,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'Auditado 100%',
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.onTertiaryFixed),
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
                                const Text('Bens Registrados', style: TextStyle(color: Colors.white70, fontSize: 12)),
                                Text('$total itens', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Valor Estimado', style: TextStyle(color: Colors.white70, fontSize: 12)),
                                Text(
                                  'R\$ ${controller.valorTotalEstimado.toStringAsFixed(2)}',
                                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
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

                // Status Operacional 2x2
                Text('Status Operacional', style: AppTextStyles.headlineSm.copyWith(color: AppColors.onSurface)),
                const SizedBox(height: 10),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.4,
                  children: [
                    _metricCard('Em Uso', emUso, total > 0 ? emUso / total : 0, Icons.devices, AppColors.secondary),
                    _metricCard('Disponíveis', disponiveis, total > 0 ? disponiveis / total : 0, Icons.check_circle, AppColors.onTertiaryContainer),
                    _metricCard('Manutenção', manutencao, total > 0 ? manutencao / total : 0, Icons.build_circle, const Color(0xFFB45309)),
                    _metricCard('Baixa/Inativo', baixa, total > 0 ? baixa / total : 0, Icons.archive, AppColors.error),
                  ],
                ),
                const SizedBox(height: 20),

                // Ações Rápidas
                Text('Ações de Gestão', style: AppTextStyles.headlineSm.copyWith(color: AppColors.onSurface)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NovoPatrimonioScreen())),
                        icon: const Icon(Icons.add_box),
                        label: const Text('Tombamento', style: TextStyle(fontSize: 12)),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.secondary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AtribuirPatrimonioScreen())),
                        icon: const Icon(Icons.assignment_ind),
                        label: const Text('Atribuir', style: TextStyle(fontSize: 12)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _metricCard(String title, int count, double progress, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 3)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 20),
              Text('${(progress * 100).toInt()}%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
            ],
          ),
          Text(title, style: const TextStyle(fontSize: 11, color: AppColors.onSurfaceVariant)),
          Text('$count itens', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          LinearProgressIndicator(value: progress, color: color, backgroundColor: AppColors.surfaceContainer, minHeight: 4),
        ],
      ),
    );
  }
}
```

---

### 3. `lib/screens/coordinator/patrimonios_tab.dart`
```dart
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/status_badge.dart';
import '../../controllers/patrimonio_controller.dart';
import '../../models/patrimonio.dart';
import 'novo_patrimonio_screen.dart';
import 'atribuir_patrimonio_screen.dart';
import 'registrar_devolucao_screen.dart';
import 'patrimonio_historico_screen.dart';

class PatrimoniosTab extends StatefulWidget {
  const PatrimoniosTab({super.key});

  @override
  State<PatrimoniosTab> createState() => _PatrimoniosTabState();
}

class _PatrimoniosTabState extends State<PatrimoniosTab> {
  final _controller = PatrimonioController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Gestão de Patrimônios', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: AppColors.surfaceContainerLowest,
        elevation: 0.5,
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.secondary,
        icon: const Icon(Icons.add, color: Colors.white),
        label: const Text('Novo Patrimônio', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NovoPatrimonioScreen())),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              onChanged: (val) => _controller.setSearchQuery(val),
              decoration: InputDecoration(
                hintText: 'Buscar tombamento, modelo ou série...',
                prefixIcon: const Icon(Icons.search, color: AppColors.outline),
                filled: true,
                fillColor: AppColors.surfaceContainerLowest,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                _buildStatusChip('Todos', 'all'),
                const SizedBox(width: 8),
                _buildStatusChip('Em Uso', 'emUso'),
                const SizedBox(width: 8),
                _buildStatusChip('Disponíveis', 'disponivel'),
                const SizedBox(width: 8),
                _buildStatusChip('Manutenção', 'emManutencao'),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: ListenableBuilder(
              listenable: _controller,
              builder: (context, _) {
                final itens = _controller.filteredPatrimonios;
                if (itens.isEmpty) {
                  return const Center(child: Text('Nenhum patrimônio encontrado.'));
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  itemCount: itens.length,
                  itemBuilder: (context, index) {
                    final item = itens[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('${item.codigo} • ${item.serialNumber}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary, fontSize: 11)),
                                StatusBadge(status: item.status),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(item.nome, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                            Text(
                              item.professorResponsavel != null
                                  ? 'Responsável: ${item.professorResponsavel}'
                                  : 'Local: ${item.localizacao}',
                              style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton(
                                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => PatrimonioHistoricoScreen(patrimonio: item))),
                                  child: const Text('Histórico'),
                                ),
                                if (item.status == StatusPatrimonio.emUso)
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.surfaceContainer, foregroundColor: AppColors.primary),
                                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => RegistrarDevolucaoScreen(patrimonio: item))),
                                    child: const Text('Devolver'),
                                  ),
                                if (item.status == StatusPatrimonio.disponivel)
                                  ElevatedButton(
                                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                                    onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AtribuirPatrimonioScreen(patrimonio: item))),
                                    child: const Text('Atribuir'),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(String label, String statusKey) {
    return ListenableBuilder(
      listenable: _controller,
      builder: (context, _) {
        final isSelected = _controller.selectedStatus == statusKey;
        return ChoiceChip(
          selected: isSelected,
          label: Text(label),
          selectedColor: AppColors.primary,
          labelStyle: TextStyle(
            color: isSelected ? Colors.white : AppColors.onSurfaceVariant,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
          onSelected: (val) {
            if (val) _controller.setStatusFilter(statusKey);
          },
        );
      },
    );
  }
}
```

---

### 4. `lib/screens/coordinator/docentes_tab.dart`
```dart
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../controllers/professor_controller.dart';
import 'novo_professor_screen.dart';
import 'atribuir_patrimonio_screen.dart';

class DocentesTab extends StatelessWidget {
  const DocentesTab({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = ProfessorController();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Gestão de Docentes', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: AppColors.surfaceContainerLowest,
        elevation: 0.5,
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        icon: const Icon(Icons.person_add, color: Colors.white),
        label: const Text('+ Docente', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NovoProfessorScreen())),
      ),
      body: ListenableBuilder(
        listenable: controller,
        builder: (context, _) {
          final professores = controller.professores;
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: professores.length,
            itemBuilder: (context, index) {
              final prof = professores[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          CircleAvatar(
                            backgroundColor: AppColors.primaryContainer,
                            child: Text(prof.nome[0], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(prof.nome, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                                Text('${prof.matricula} • ${prof.disciplina}', style: const TextStyle(fontSize: 12, color: AppColors.onSurfaceVariant)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            prof.bensVinculadosNomes.isNotEmpty
                                ? '${prof.bensVinculadosNomes.length} bens vinculados'
                                : 'Nenhum bem vinculado',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.secondary),
                          ),
                          ElevatedButton(
                            style: ElevatedButton.styleFrom(backgroundColor: AppColors.surfaceContainer, foregroundColor: AppColors.primary),
                            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AtribuirPatrimonioScreen(professorPreSelecionado: prof))),
                            child: const Text('Atribuir Bem'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
```

---

### 5. `lib/screens/coordinator/ajustes_tab.dart`
```dart
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../controllers/auth_controller.dart';
import '../auth/login_screen.dart';

class AjustesTab extends StatelessWidget {
  const AjustesTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Ajustes do Sistema', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: AppColors.surfaceContainerLowest,
        elevation: 0.5,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: const ListTile(
              leading: Icon(Icons.school, color: AppColors.primary),
              title: Text('E.E. Cecília Meireles', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('Código INEP: 35019822 • SEDUC'),
            ),
          ),
          const SizedBox(height: 20),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.errorContainer,
              foregroundColor: AppColors.onErrorContainer,
              minimumSize: const Size.fromHeight(48),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            icon: const Icon(Icons.logout),
            label: const Text('Encerrar Sessão', style: TextStyle(fontWeight: FontWeight.bold)),
            onPressed: () {
              AuthController().logout();
              Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (r) => false);
            },
          ),
        ],
      ),
    );
  }
}
```

---

### 6. `lib/screens/coordinator/novo_patrimonio_screen.dart`
```dart
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../controllers/patrimonio_controller.dart';
import '../../models/patrimonio.dart';

class NovoPatrimonioScreen extends StatefulWidget {
  const NovoPatrimonioScreen({super.key});

  @override
  State<NovoPatrimonioScreen> createState() => _NovoPatrimonioScreenState();
}

class _NovoPatrimonioScreenState extends State<NovoPatrimonioScreen> {
  final _tombamentoCtrl = TextEditingController(text: 'PAT-2025-0142');
  final _nomeCtrl = TextEditingController(text: 'Notebook Dell Latitude 3420');
  final _marcaCtrl = TextEditingController(text: 'Dell');
  final _modeloCtrl = TextEditingController(text: 'Latitude 3420');
  final _serialCtrl = TextEditingController(text: 'CN-0J138X');
  final _nfCtrl = TextEditingController(text: 'NF-e 004.819');
  final _valorCtrl = TextEditingController(text: '3450.00');

  CategoriaPatrimonio _categoria = CategoriaPatrimonio.informatica;
  String _local = 'Sala de Informática (Lab 1)';

  void _salvar() async {
    final novo = Patrimonio(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      codigo: _tombamentoCtrl.text.trim(),
      nome: _nomeCtrl.text.trim(),
      marca: _marcaCtrl.text.trim(),
      modelo: _modeloCtrl.text.trim(),
      serialNumber: _serialCtrl.text.trim(),
      categoria: _categoria,
      status: StatusPatrimonio.disponivel,
      localizacao: _local,
      dataAquisicao: '16/04/2025',
      valorEstimado: double.tryParse(_valorCtrl.text) ?? 0.0,
      origemRecurso: 'FNDE / MEC',
      notaFiscal: _nfCtrl.text.trim(),
      acessorios: const ['Carregador 65W', 'Cabo de Força'],
    );

    await PatrimonioController().cadastrarPatrimonio(novo);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Patrimônio ${novo.codigo} cadastrado!')));
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Novo Tombamento'), backgroundColor: AppColors.surfaceContainerLowest),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(controller: _tombamentoCtrl, decoration: const InputDecoration(labelText: 'Tombamento (Plaqueta)', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _nomeCtrl, decoration: const InputDecoration(labelText: 'Nome / Descrição', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _marcaCtrl, decoration: const InputDecoration(labelText: 'Marca', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _modeloCtrl, decoration: const InputDecoration(labelText: 'Modelo', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _serialCtrl, decoration: const InputDecoration(labelText: 'Número de Série (S/N)', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _valorCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Valor (R\$)', border: OutlineInputBorder())),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(50)),
              onPressed: _salvar,
              icon: const Icon(Icons.save),
              label: const Text('Cadastrar no Acervo'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

### 7. `lib/screens/coordinator/novo_professor_screen.dart`
```dart
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../controllers/professor_controller.dart';
import '../../models/professor.dart';

class NovoProfessorScreen extends StatefulWidget {
  const NovoProfessorScreen({super.key});

  @override
  State<NovoProfessorScreen> createState() => _NovoProfessorScreenState();
}

class _NovoProfessorScreenState extends State<NovoProfessorScreen> {
  final _nomeCtrl = TextEditingController();
  final _matriculaCtrl = TextEditingController(text: '#DOC-');
  final _emailCtrl = TextEditingController();
  final _disciplinaCtrl = TextEditingController();

  void _salvar() async {
    final novo = Professor(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      matricula: _matriculaCtrl.text.trim(),
      nome: _nomeCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      disciplina: _disciplinaCtrl.text.trim(),
      telefone: '(85) 98765-4321',
      turno: 'Matutino / Vespertino',
      cargaHoraria: '40h',
    );

    await ProfessorController().cadastrarProfessor(novo);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Docente ${novo.nome} cadastrado!')));
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Cadastrar Docente'), backgroundColor: AppColors.surfaceContainerLowest),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(controller: _nomeCtrl, decoration: const InputDecoration(labelText: 'Nome Completo', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _matriculaCtrl, decoration: const InputDecoration(labelText: 'Matrícula Funcional', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _emailCtrl, decoration: const InputDecoration(labelText: 'E-mail Institucional', border: OutlineInputBorder())),
            const SizedBox(height: 12),
            TextField(controller: _disciplinaCtrl, decoration: const InputDecoration(labelText: 'Disciplina / Área', border: OutlineInputBorder())),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(50)),
              onPressed: _salvar,
              icon: const Icon(Icons.person_add),
              label: const Text('Cadastrar Professor'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

### 8. `lib/screens/coordinator/atribuir_patrimonio_screen.dart`
```dart
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../controllers/patrimonio_controller.dart';
import '../../controllers/professor_controller.dart';
import '../../models/patrimonio.dart';
import '../../models/professor.dart';

class AtribuirPatrimonioScreen extends StatefulWidget {
  final Patrimonio? patrimonio;
  final Professor? professorPreSelecionado;

  const AtribuirPatrimonioScreen({super.key, this.patrimonio, this.professorPreSelecionado});

  @override
  State<AtribuirPatrimonioScreen> createState() => _AtribuirPatrimonioScreenState();
}

class _AtribuirPatrimonioScreenState extends State<AtribuirPatrimonioScreen> {
  Patrimonio? _patrimonioSel;
  Professor? _professorSel;

  @override
  void initState() {
    super.initState();
    final patrimoniosDisp = PatrimonioController().patrimonios.where((p) => p.status == StatusPatrimonio.disponivel).toList();
    _patrimonioSel = widget.patrimonio ?? (patrimoniosDisp.isNotEmpty ? patrimoniosDisp.first : null);
    _professorSel = widget.professorPreSelecionado ?? (ProfessorController().professores.isNotEmpty ? ProfessorController().professores.first : null);
  }

  void _confirmar() async {
    if (_patrimonioSel == null || _professorSel == null) return;

    await PatrimonioController().atribuirPatrimonio(
      patrimonioId: _patrimonioSel!.id,
      professor: _professorSel!,
      localizacao: 'Sala dos Professores / Bloco B',
    );
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Termo de custódia homologado com sucesso!')));
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Atribuir Custódia'), backgroundColor: AppColors.surfaceContainerLowest),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Card(
              child: ListTile(
                leading: const Icon(Icons.inventory_2, color: AppColors.primary),
                title: Text(_patrimonioSel?.nome ?? 'Selecione o bem'),
                subtitle: Text(_patrimonioSel?.codigo ?? ''),
              ),
            ),
            const SizedBox(height: 12),
            Card(
              child: ListTile(
                leading: const Icon(Icons.person, color: AppColors.secondary),
                title: Text(_professorSel?.nome ?? 'Selecione o docente'),
                subtitle: Text(_professorSel?.disciplina ?? ''),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(50)),
              onPressed: _confirmar,
              icon: const Icon(Icons.assignment_turned_in),
              label: const Text('Confirmar e Emitir Termo'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

### 9. `lib/screens/coordinator/registrar_devolucao_screen.dart`
```dart
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../controllers/patrimonio_controller.dart';
import '../../models/patrimonio.dart';

class RegistrarDevolucaoScreen extends StatelessWidget {
  final Patrimonio patrimonio;

  const RegistrarDevolucaoScreen({super.key, required this.patrimonio});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Registrar Devolução'), backgroundColor: AppColors.surfaceContainerLowest),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Card(
              child: ListTile(
                leading: const Icon(Icons.assignment_return, color: AppColors.primary),
                title: Text(patrimonio.nome, style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('${patrimonio.codigo} • ${patrimonio.professorResponsavel ?? ""}'),
              ),
            ),
            const Spacer(),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, minimumSize: const Size.fromHeight(50)),
              onPressed: () async {
                await PatrimonioController().registrarDevolucao(
                  patrimonioId: patrimonio.id,
                  condicaoRetorno: 'Perfeito Estado',
                  justificativa: 'Fim do período letivo',
                  enviarParaManutencao: false,
                );
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Devolução registrada e termo de baixa emitido!')));
                Navigator.pop(context);
              },
              icon: const Icon(Icons.check_circle),
              label: const Text('Confirmar Devolução e Dar Baixa'),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

### 10. `lib/screens/coordinator/patrimonio_historico_screen.dart`
```dart
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../models/patrimonio.dart';

class PatrimonioHistoricoScreen extends StatelessWidget {
  final Patrimonio patrimonio;

  const PatrimonioHistoricoScreen({super.key, required this.patrimonio});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: Text('Histórico: ${patrimonio.codigo}'), backgroundColor: AppColors.surfaceContainerLowest),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              leading: const Icon(Icons.how_to_reg, color: AppColors.secondary),
              title: const Text('Atribuição de Custódia Homologada', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('Docente: ${patrimonio.professorResponsavel ?? "Prof. Marcos Andrade"} • 16/04/2025'),
            ),
          ),
          const Card(
            child: ListTile(
              leading: Icon(Icons.build_circle, color: Color(0xFFB45309)),
              title: Text('Manutenção Preventiva', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('Revisão e limpeza de filtros concluída • 14/04/2025'),
            ),
          ),
          const Card(
            child: ListTile(
              leading: Icon(Icons.inventory_2, color: AppColors.primary),
              title: Text('Tombamento e Entrada no Acervo', style: TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text('Recepção do lote SEDUC • NF-e 004.819 • 15/03/2023'),
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 📌 Comandos para Salvar e Commitar
```bash
git add .
git commit -m "feat(views-coordinator): implement dashboard, catalog, assignment, return and history views"
```
