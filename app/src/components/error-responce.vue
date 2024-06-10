<script lang="ts">
// エラーのステータスコードによって飛ばすページを変更する
import { useRouter } from 'vue-router';

const router = useRouter();

function ErrorResponce(error: object | any) {
    if (error.code === 404) {
        router.push('/404');
    } else if (error.code === 500) {
        router.push('/500');
    } else {
        router.push('/404');
        console.error(error)
    }
}

export default ErrorResponce;

</script>
