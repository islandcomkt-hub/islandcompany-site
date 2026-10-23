# Revisão Topography e componentes nativos — 18/10/2026

- Hero usa o Topography fornecido pelo usuário, com os 16 parâmetros solicitados. Fonte original preservada em effects/vendor/Topography.jsx.
- Portfólio: descrição, instruções e CTA em um bloco centralizado sem separadores; 9 capturas reais, rotação e interação nativas.
- Especialidades: Spotlight Bento original com imagens já existentes da Island, textos reais, suporte de foco/teclado e toque.
- Fundador: Showcase Card original com foto real de Johanes; abrir/recolher com Enter/Espaço e link de conversa correto.
- Método: adaptação da expansão, onda e curvas do ScrollingWaveText para a sequência vertical ISLAND solicitada. O original move uma frase horizontalmente; portanto esta coreografia é uma adaptação, não o componente original sem alterações.
- Os módulos Framer são locais e executados pelo unframer 4.2.1. Fontes da interface hospedadas no projeto. Componentes carregados por proximidade da seção.
- Removidas reduções de movimento adicionadas anteriormente. Parâmetros nativos preservados; runtime Framer configurado sem redução. Preferências internas do carrossel original permanecem no código original. Windows teve animações de interface/janelas reativadas conforme pedido; navegador confirmou preferência de movimento normal.
- Não houve publicação, alteração de DNS nem mudança de permissões da Base.

Validação: npm run build e npx tsc --noEmit aprovados. Navegador sem erros de console observados. Responsividade checada em 320/390/768/1440; progressão e reversão do método conferidas; card por teclado conferido. Não foi medido FPS em hardware real nem realizado novo teste autenticado da Base. Rotas originais e API preservadas por comparação com Git.

O runtime Framer acrescenta aproximadamente 144 KB gzip compartilhados. A preservação dos efeitos nativos teve prioridade; não há alegação de redução absoluta de peso nem pontuação Lighthouse certificada.
