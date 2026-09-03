import subprocess
import sys
import datetime

def run_cmd(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8')
    return result.returncode, result.stdout.strip(), result.stderr.strip()

def main():
    task_desc = sys.argv[1] if len(sys.argv) > 1 else 'ai-update'
    
    # 1. Verificar se há alterações
    code, status_out, _ = run_cmd('git status --porcelain')
    if not status_out:
        print('Nenhuma alteração pendente para commit.')
        return

    # 2. Criar nome de branch seguro
    timestamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    slug = ''.join(c if c.isalnum() or c in '-' else '-' for c in task_desc.lower())[:30].strip('-')
    branch_name = f'ia/{slug}-{timestamp}'

    # 3. Criar e mudar para a nova branch
    print(f'-> Criando branch: {branch_name}')
    run_cmd(f'git checkout -b {branch_name}')

    # 4. Adicionar arquivos e commitar
    print('-> Realizando commit...')
    run_cmd('git add .')
    commit_msg = f'feat(ia): {task_desc}'
    run_cmd(f'git commit -m "{commit_msg}"')

    # 5. Push para o GitHub
    print(f'-> Enviando branch para o GitHub: {branch_name}...')
    code, push_out, push_err = run_cmd(f'git push origin {branch_name}')
    
    # 6. Gerar URL de Pull Request
    pr_url = f'https://github.com/NicolasBertacin/teste_tcc/compare/{branch_name}?expand=1'
    print('\n' + '='*60)
    print('✅ Alterações enviadas com sucesso!')
    print(f'🌿 Branch criada: {branch_name}')
    print(f'🔗 Link para abrir e aprovar o Pull Request no GitHub:')
    print(pr_url)
    print('='*60 + '\n')

if __name__ == '__main__':
    main()
