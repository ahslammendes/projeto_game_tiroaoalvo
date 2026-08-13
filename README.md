# Tiro ao Alvo 3D Pixel

Um jogo simples de tiro ao alvo em 3D, construído diretamente no navegador usando HTML, CSS e JavaScript com a biblioteca **Three.js**.

## 🎮 Sobre o Jogo

O jogo coloca o jogador em uma perspectiva em primeira pessoa (FPS). O objetivo é acertar o maior número de alvos de papel (silhuetas) que aparecem e se movem pela tela dentro de um limite de tempo de 60 segundos. 

Cada acerto gera uma pequena explosão de partículas e concede 10 pontos ao jogador.

## 🚀 Tecnologias Utilizadas

* **HTML5**: Estrutura da interface do usuário (menus, HUD, tela de game over).
* **CSS3**: Estilização da interface utilizando técnicas modernas como Glassmorphism, fontes personalizadas (Google Fonts - Outfit) e um cursor em formato de mira customizada (Crosshair).
* **JavaScript**: Lógica principal do jogo.
* **Three.js**: Biblioteca utilizada para renderizar toda a cena 3D, luzes, câmera, física básica, geração de partículas e detecção de colisões (Raycasting).

## 🕹️ Como Jogar

1. Abra o arquivo `index.html` no seu navegador web.
2. Clique na tela inicial para começar o jogo e "travar" o ponteiro do mouse (Pointer Lock).
3. **Mire:** Mova o mouse para movimentar a câmera e mirar.
4. **Atire:** Clique com o botão esquerdo do mouse para atirar nos alvos.
5. Se precisar pausar, pressione a tecla `ESC`. Clique novamente na tela para retornar.
6. Ao final dos 60 segundos, sua pontuação será exibida na tela de Fim de Jogo.

## 📂 Estrutura de Arquivos

* `index.html`: Contém a marcação da interface UI (telas de início, HUD com pontuação/tempo e game over) e importa os scripts.
* `style.css`: Estilos para a interface, garantindo que o canvas 3D fique ao fundo e as telas do jogo se sobreponham com efeitos visuais.
* `script.js`: O motor principal do jogo. Configura a cena 3D (Three.js), desenha os alvos (usando Canvas 2D como textura em objetos 3D), gerencia as interações do mouse (Raycaster e PointerLock) e a mecânica de pontuação/tempo.
