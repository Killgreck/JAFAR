# Despliegue Backend "jafar" en AWS EC2

Este directorio contiene los recursos necesarios para desplegar la plataforma backend con enfoque bancario y seguridad reforzada.

## Arquitectura General

Se separan los componentes en dos grupos:

1. **Core Services (`docker-compose.core.yml`)**
   - `gateway`: proxy inverso (Nginx) que termina TLS y dirige tráfico a microservicios.
   - `auth-service`: autenticación y emisión de tokens con dependencias a Mongo y Redis.
   - `api-service`: API principal (servicio Express actual). Escalable horizontalmente.
   - `wallet-service`: gestiona saldos, bloqueos y conciliaciones con el ledger.
   - `transaction-service`: registra movimientos y publica eventos.
   - `ledger-service`: servicio que interactúa con base relacional para contabilidad de doble entrada.
   - `notification-service`: envía emails/SMS/push de eventos críticos.
   - `risk-service`: analítica antifraude y límites.
   - `monitoring-stack`: Prometheus/Grafana u otra herramienta centralizada.

2. **Data Layer (`docker-compose.data.yml`)**
   - `mongo-primary`, `mongo-secondary`, `mongo-arbiter`: réplica de MongoDB con autenticación.
   - `redis`: cache y sesiones.
   - `postgres-ledger`: almacén relacional para contabilidad.

Cada compose usa `.env.ec2` para credenciales y configuración.

## Flujo de despliegue en EC2

1. **Preparar instancia**
   - Sistema operativo mínimo (Ubuntu 22.04 LTS).
   - Instalar Docker y Docker Compose plugin.
   - Endurecer SSH (usuarios, claves, fail2ban, firewall, SSM opcional).

2. **Configurar redes y seguridad**
   - Security Groups: abrir solo 80/443 para el proxy, puertos internos cerrados.
   - VPC/Subred privada para datos; usar Network ACL restrictivas.
   - TLS: subir certificados a `gateway-certs` o integrar con ACM + Nginx TLS passthrough.

3. **Variables y secretos**
   - Copiar `.env.ec2.example` a `.env.ec2` y completar con valores reales.
   - Manejar secretos (contraseñas DB, JWT) mediante AWS Secrets Manager/SSM Parameter Store.
   - Rotar claves de forma periódica.

4. **Orquestación manual**
   ```bash
   docker compose -f docker-compose.data.yml up -d
   ./scripts/init-replica.sh
   docker compose -f docker-compose.core.yml up -d
   ```

5. **Post despliegue**
   - Verificar salud con `docker compose ps` y `/health` por servicio.
   - Activar monitoreo y alertas (CloudWatch + Prometheus).
   - Configurar backups automáticos (Mongo snapshots, pg_dump, Redis AOF).

## Consideraciones de seguridad

- Reglas de firewall estrictas: acceso a Mongo/Postgres solo desde subred privada.
- TLS obligatorio y HTTPS redirect en gateway.
- Logs enviados a CloudWatch/ELK sin datos sensibles.
- Auditoría de acciones críticas firmada digitalmente.
- Tests de penetración / revisión de código antes de releases.

## Escalamiento

- Réplicas de microservicios usando `deploy.replicas` o escalar manualmente (`docker compose scale`).
- Balanceo con ALB delante del gateway o múltiples instancias EC2 + Auto Scaling Group.
- Migrar a Kubernetes/ECS cuando se requiera autoescalado y actualizaciones rolling.

## Scripts

- `scripts/init-mongo.js`: crea usuarios de aplicación y ledger.
- `scripts/init-replica.sh`: inicia replica set RS0 (ejecutar una vez).

## Próximos pasos sugeridos

- Incorporar CI/CD (GitHub Actions + ECR + ECS/EC2).
- Integrar WAF, Shield, GuardDuty.
- Añadir tests automáticos de seguridad (SAST/DAST).
- Evaluar Managed MongoDB (Atlas, DocumentDB) para reducir carga operativa.
